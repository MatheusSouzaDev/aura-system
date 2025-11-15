import { getDashboardContext } from "../dashboard-context";
import { db } from "@/app/_lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import {
  DashboardData,
  TotalExpensePerCategory,
  TransactionPercentagePerType,
} from "./types";
import { getAccountsForUserId } from "../accounts";

interface GetDashboardParams {
  month?: string;
  year?: string;
}

const calculatePercentage = (value: number, total: number) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const getSignedAmount = (type: TransactionType, amount: number) => {
  if (type === TransactionType.DEPOSIT) {
    return amount;
  }

  return -amount;
};

export const getDashboard = async ({
  month,
  year,
}: GetDashboardParams = {}): Promise<DashboardData> => {
  const { currentPeriod, userId } = await getDashboardContext({
    month,
    year,
  });

  const accounts = await getAccountsForUserId(userId);
  const buildAccountFilter = (ids: string[]) =>
    ids.length
      ? {
          accountId: {
            in: ids,
          },
        }
      : {};

  const balanceAccountIds = accounts
    .filter((account) => account.includeInBalance)
    .map((account) => account.id);
  const cashFlowAccountIds = accounts
    .filter((account) => account.includeInCashFlow)
    .map((account) => account.id);
  const investmentAccountIds = accounts
    .filter((account) => account.includeInInvestments)
    .map((account) => account.id);
  const percentageAccountIds = Array.from(
    new Set([
      ...balanceAccountIds,
      ...cashFlowAccountIds,
      ...investmentAccountIds,
    ]),
  );

  const currentExecutedWhere = {
    userId,
    status: TransactionStatus.EXECUTED,
    executedAt: {
      gte: currentPeriod.start,
      lte: currentPeriod.end,
    },
  };

  const executedBeforeCurrentWhere = {
    userId,
    status: TransactionStatus.EXECUTED,
    executedAt: {
      lt: currentPeriod.start,
    },
  };

  const [
    depositAggregate,
    expensesAggregate,
    investmentsAggregate,
    transactionsAggregate,
    expensesPerCategoryAggregate,
    lastTransactions,
    balanceDepositAggregate,
    balanceExpensesAggregate,
    balanceInvestmentsAggregate,
    previousBalanceDepositAggregate,
    previousBalanceExpensesAggregate,
    previousBalanceInvestmentsAggregate,
    accountBalanceGroups,
    forecastTransactionsInPeriod,
  ] = await Promise.all([
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.DEPOSIT,
        ...buildAccountFilter(cashFlowAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.EXPENSE,
        ...buildAccountFilter(cashFlowAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.INVESTMENT,
        ...buildAccountFilter(investmentAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        ...buildAccountFilter(percentageAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: {
        ...currentExecutedWhere,
        type: TransactionType.EXPENSE,
        ...buildAccountFilter(cashFlowAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          date: "desc",
        },
      ],
      take: 15,
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.DEPOSIT,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.EXPENSE,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.INVESTMENT,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...executedBeforeCurrentWhere,
        type: TransactionType.DEPOSIT,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...executedBeforeCurrentWhere,
        type: TransactionType.EXPENSE,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...executedBeforeCurrentWhere,
        type: TransactionType.INVESTMENT,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["accountId", "type"],
      where: {
        userId,
        status: TransactionStatus.EXECUTED,
      },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: {
        userId,
        status: TransactionStatus.PENDING,
        date: {
          gte: currentPeriod.start,
          lte: currentPeriod.end,
        },
      },
    }),
  ]);

  const depositTotal = Number(depositAggregate._sum.amount ?? 0);
  const expensesTotal = Number(expensesAggregate._sum.amount ?? 0);
  const investmentsTotal = Number(investmentsAggregate._sum.amount ?? 0);
  const transactionsTotal = Number(transactionsAggregate._sum.amount ?? 0);

  const balanceDepositTotal = Number(balanceDepositAggregate._sum.amount ?? 0);
  const balanceExpensesTotal = Number(
    balanceExpensesAggregate._sum.amount ?? 0,
  );
  const balanceInvestmentsTotal = Number(
    balanceInvestmentsAggregate._sum.amount ?? 0,
  );

  const previousMonthDepositTotal = Number(
    previousBalanceDepositAggregate._sum.amount ?? 0,
  );
  const previousMonthExpensesTotal = Number(
    previousBalanceExpensesAggregate._sum.amount ?? 0,
  );
  const previousMonthInvestmentsTotal = Number(
    previousBalanceInvestmentsAggregate._sum.amount ?? 0,
  );

  const previousMonthBalance =
    previousMonthDepositTotal -
    previousMonthExpensesTotal -
    previousMonthInvestmentsTotal;
  const balanceDifference =
    balanceDepositTotal - balanceExpensesTotal - balanceInvestmentsTotal;
  const balanceTotal = previousMonthBalance + balanceDifference;
  const forecastPendingImpact = forecastTransactionsInPeriod.reduce(
    (total, transaction) =>
      total + getSignedAmount(transaction.type, Number(transaction.amount)),
    0,
  );
  const forecastDifference = balanceDifference + forecastPendingImpact;
  const forecastBalance = previousMonthBalance + forecastDifference;

  const accountTotals = accountBalanceGroups.reduce<
    Record<
      string,
      {
        deposit: number;
        expense: number;
        investment: number;
      }
    >
  >((totals, group) => {
    if (!group.accountId) {
      return totals;
    }

    const currentTotals = totals[group.accountId] ?? {
      deposit: 0,
      expense: 0,
      investment: 0,
    };

    if (group.type === TransactionType.DEPOSIT) {
      currentTotals.deposit += Number(group._sum.amount ?? 0);
    }
    if (group.type === TransactionType.EXPENSE) {
      currentTotals.expense += Number(group._sum.amount ?? 0);
    }
    if (group.type === TransactionType.INVESTMENT) {
      currentTotals.investment += Number(group._sum.amount ?? 0);
    }

    totals[group.accountId] = currentTotals;
    return totals;
  }, {});

  const accountsSummary = accounts.map((account) => {
    const totals = accountTotals[account.id] ?? {
      deposit: 0,
      expense: 0,
      investment: 0,
    };

    return {
      id: account.id,
      name: account.name,
      color: account.color,
      includeInBalance: account.includeInBalance,
      includeInCashFlow: account.includeInCashFlow,
      includeInInvestments: account.includeInInvestments,
      includeInAiReports: account.includeInAiReports,
      includeInOverview: account.includeInOverview,
      balance: totals.deposit - totals.expense - totals.investment,
    };
  });

  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: calculatePercentage(
      depositTotal,
      transactionsTotal,
    ),
    [TransactionType.EXPENSE]: calculatePercentage(
      expensesTotal,
      transactionsTotal,
    ),
    [TransactionType.INVESTMENT]: calculatePercentage(
      investmentsTotal,
      transactionsTotal,
    ),
  };

  const totalExpensePerCategory: TotalExpensePerCategory[] =
    expensesPerCategoryAggregate.map(
      (category) =>
        ({
          category: category.category,
          totalAmount: Number(category._sum.amount ?? 0),
          percentageOfTotal: calculatePercentage(
            Number(category._sum.amount ?? 0),
            expensesTotal,
          ),
        }) satisfies TotalExpensePerCategory,
    );

  const safeLastTransactions = JSON.parse(
    JSON.stringify(lastTransactions),
  ) as DashboardData["lastTransactions"];

  return {
    depositTotal,
    expensesTotal,
    investmentsTotal,
    balanceTotal,
    previousMonthBalance,
    balanceDifference,
    forecastBalance,
    forecastDifference,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: safeLastTransactions,
    accounts: accountsSummary,
  };
};

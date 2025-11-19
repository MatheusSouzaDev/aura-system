import { getDashboardContext } from "../dashboard-context";
import { db } from "@/app/_lib/prisma";
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
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
  if (type === TransactionType.TRANSFER) {
    return 0;
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

  const buildTransferAccountFilter = (ids: string[]) =>
    ids.length
      ? {
          transferAccountId: {
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
    expensesPerCategoryAggregate,
    lastTransactions,
    balanceDepositAggregate,
    balanceExpensesAggregate,
    balanceInvestmentsAggregate,
    previousBalanceDepositAggregate,
    previousBalanceExpensesAggregate,
    previousBalanceInvestmentsAggregate,
    transferOutBalanceAggregate,
    transferInBalanceAggregate,
    previousTransferOutBalanceAggregate,
    previousTransferInBalanceAggregate,
    accountBalanceGroups,
    accountInvestmentGroups,
    transferInAccountGroups,
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
        category: TransactionCategory.INVESTMENT,
        type: TransactionType.EXPENSE,
        ...buildAccountFilter(investmentAccountIds),
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
        category: TransactionCategory.INVESTMENT,
        type: TransactionType.EXPENSE,
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
        category: TransactionCategory.INVESTMENT,
        type: TransactionType.EXPENSE,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.TRANSFER,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentExecutedWhere,
        type: TransactionType.TRANSFER,
        ...buildTransferAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...executedBeforeCurrentWhere,
        type: TransactionType.TRANSFER,
        ...buildAccountFilter(balanceAccountIds),
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...executedBeforeCurrentWhere,
        type: TransactionType.TRANSFER,
        ...buildTransferAccountFilter(balanceAccountIds),
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
    db.transaction.groupBy({
      by: ["accountId"],
      where: {
        userId,
        status: TransactionStatus.EXECUTED,
        category: TransactionCategory.INVESTMENT,
        type: TransactionType.EXPENSE,
      },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["transferAccountId"],
      where: {
        userId,
        status: TransactionStatus.EXECUTED,
        type: TransactionType.TRANSFER,
        transferAccountId: {
          not: null,
        },
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
  const transactionsTotal = depositTotal + expensesTotal + investmentsTotal;

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
  const transferOutBalanceTotal = Number(
    transferOutBalanceAggregate._sum.amount ?? 0,
  );
  const transferInBalanceTotal = Number(
    transferInBalanceAggregate._sum.amount ?? 0,
  );
  const previousTransferOutBalanceTotal = Number(
    previousTransferOutBalanceAggregate._sum.amount ?? 0,
  );
  const previousTransferInBalanceTotal = Number(
    previousTransferInBalanceAggregate._sum.amount ?? 0,
  );

  const previousMonthBalance =
    previousMonthDepositTotal -
    previousMonthExpensesTotal -
    previousMonthInvestmentsTotal -
    previousTransferOutBalanceTotal +
    previousTransferInBalanceTotal;
  const balanceDifference =
    balanceDepositTotal -
    balanceExpensesTotal -
    balanceInvestmentsTotal -
    transferOutBalanceTotal +
    transferInBalanceTotal;
  const balanceTotal = previousMonthBalance + balanceDifference;
  const forecastPendingImpact = forecastTransactionsInPeriod.reduce(
    (total, transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.type === TransactionType.TRANSFER) {
        let impact = 0;
        if (
          transaction.accountId &&
          balanceAccountIds.includes(transaction.accountId)
        ) {
          impact -= amount;
        }
        if (
          transaction.transferAccountId &&
          balanceAccountIds.includes(transaction.transferAccountId)
        ) {
          impact += amount;
        }
        return total + impact;
      }

      return total + getSignedAmount(transaction.type, amount);
    },
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
        transferOut: number;
        transferIn: number;
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
      transferOut: 0,
      transferIn: 0,
    };

    if (group.type === TransactionType.DEPOSIT) {
      currentTotals.deposit += Number(group._sum.amount ?? 0);
    }
    if (group.type === TransactionType.EXPENSE) {
      currentTotals.expense += Number(group._sum.amount ?? 0);
    }
    if (group.type === TransactionType.TRANSFER) {
      currentTotals.transferOut += Number(group._sum.amount ?? 0);
    }

    totals[group.accountId] = currentTotals;
    return totals;
  }, {});

  accountInvestmentGroups.forEach((group) => {
    if (!group.accountId) {
      return;
    }

    const currentTotals = accountTotals[group.accountId] ?? {
      deposit: 0,
      expense: 0,
      investment: 0,
      transferOut: 0,
      transferIn: 0,
    };

    currentTotals.investment += Number(group._sum.amount ?? 0);
    accountTotals[group.accountId] = currentTotals;
  });

  transferInAccountGroups.forEach((group) => {
    if (!group.transferAccountId) {
      return;
    }

    const currentTotals = accountTotals[group.transferAccountId] ?? {
      deposit: 0,
      expense: 0,
      investment: 0,
      transferOut: 0,
      transferIn: 0,
    };

    currentTotals.transferIn += Number(group._sum.amount ?? 0);
    accountTotals[group.transferAccountId] = currentTotals;
  });

  const accountsSummary = accounts.map((account) => {
    const totals = accountTotals[account.id] ?? {
      deposit: 0,
      expense: 0,
      investment: 0,
      transferOut: 0,
      transferIn: 0,
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
      balance:
        totals.deposit +
        totals.transferIn -
        totals.expense -
        totals.investment -
        totals.transferOut,
    };
  });

  const typesPercentage: TransactionPercentagePerType = {
    deposit: calculatePercentage(depositTotal, transactionsTotal),
    expense: calculatePercentage(expensesTotal, transactionsTotal),
    investment: calculatePercentage(investmentsTotal, transactionsTotal),
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

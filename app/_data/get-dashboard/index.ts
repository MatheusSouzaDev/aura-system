import { getDashboardContext } from "../dashboard-context";
import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import {
  DashboardData,
  TotalExpensePerCategory,
  TransactionPercentagePerType,
} from "./types";

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

export const getDashboard = async ({
  month,
  year,
}: GetDashboardParams = {}): Promise<DashboardData> => {
  const { currentPeriod, previousPeriod, userId } = await getDashboardContext({
    month,
    year,
  });

  const currentWhere = {
    userId,
    date: {
      gte: currentPeriod.start,
      lte: currentPeriod.end,
    },
  };

  const previousWhere = {
    userId,
    date: {
      gte: previousPeriod.start,
      lte: previousPeriod.end,
    },
  };

  const [
    depositAggregate,
    expensesAggregate,
    investmentsAggregate,
    transactionsAggregate,
    expensesPerCategoryAggregate,
    lastTransactions,
    previousDepositAggregate,
    previousExpensesAggregate,
    previousInvestmentsAggregate,
  ] = await Promise.all([
    db.transaction.aggregate({
      where: {
        ...currentWhere,
        type: TransactionType.DEPOSIT,
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentWhere,
        type: TransactionType.EXPENSE,
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...currentWhere,
        type: TransactionType.INVESTMENT,
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: currentWhere,
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: {
        ...currentWhere,
        type: TransactionType.EXPENSE,
      },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: currentWhere,
      orderBy: {
        date: "desc",
      },
      take: 15,
    }),
    db.transaction.aggregate({
      where: {
        ...previousWhere,
        type: TransactionType.DEPOSIT,
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...previousWhere,
        type: TransactionType.EXPENSE,
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        ...previousWhere,
        type: TransactionType.INVESTMENT,
      },
      _sum: { amount: true },
    }),
  ]);

  const depositTotal = Number(depositAggregate._sum.amount ?? 0);
  const expensesTotal = Number(expensesAggregate._sum.amount ?? 0);
  const investmentsTotal = Number(investmentsAggregate._sum.amount ?? 0);
  const transactionsTotal = Number(transactionsAggregate._sum.amount ?? 0);

  const previousMonthDepositTotal = Number(
    previousDepositAggregate._sum.amount ?? 0,
  );
  const previousMonthExpensesTotal = Number(
    previousExpensesAggregate._sum.amount ?? 0,
  );
  const previousMonthInvestmentsTotal = Number(
    previousInvestmentsAggregate._sum.amount ?? 0,
  );

  const previousMonthBalance =
    previousMonthDepositTotal -
    previousMonthExpensesTotal -
    previousMonthInvestmentsTotal;
  const balanceDifference = depositTotal - expensesTotal - investmentsTotal;
  const balanceTotal = previousMonthBalance + balanceDifference;

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
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: safeLastTransactions,
  };
};

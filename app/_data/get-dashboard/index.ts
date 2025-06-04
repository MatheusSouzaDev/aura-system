import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { auth } from "@clerk/nextjs/server";

export const getDashboard = async ({ month }: { month: string }) => {
  const currentYear = new Date().getFullYear();
  const selectedMonth = Number(month) - 1;
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const where = {
    userId,
    date: {
      gte: new Date(currentYear, selectedMonth, 1), // Primeiro dia do mês
      lte: new Date(currentYear, selectedMonth + 1, 0, 23, 59, 59, 999), // Último dia do mês
    },
  };

  const depositTotal = Number(
    (
      await db.transaction.aggregate({
        where: {
          type: "DEPOSIT",
          ...where,
        },
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );

  const expensesTotal = Number(
    (
      await db.transaction.aggregate({
        where: {
          type: "EXPENSE",
          ...where,
        },
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );

  const investmentsTotal = Number(
    (
      await db.transaction.aggregate({
        where: {
          type: "INVESTMENT",
          ...where,
        },
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );

  const balanceTotal = depositTotal - expensesTotal - investmentsTotal;

  const transactionsTotal = Number(
    (
      await db.transaction.aggregate({
        where,
        _sum: { amount: true },
      })
    )._sum.amount,
  );
  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: Math.round(
      (Number(depositTotal || 0) / Number(transactionsTotal)) * 100,
    ),
    [TransactionType.EXPENSE]: Math.round(
      (Number(expensesTotal || 0) / Number(transactionsTotal)) * 100,
    ),
    [TransactionType.INVESTMENT]: Math.round(
      (Number(investmentsTotal || 0) / Number(transactionsTotal)) * 100,
    ),
  };
  const totalExpensePerCategory: TotalExpensePerCategory[] = (
    await db.transaction.groupBy({
      by: ["category"],
      where: {
        ...where,
        type: TransactionType.EXPENSE,
      },
      _sum: { amount: true },
    })
  ).map(
    (category) =>
      ({
        category: category.category,
        totalAmount: Number(category._sum.amount),
        percentageOfTotal: Math.round(
          (Number(category._sum.amount) / Number(expensesTotal)) * 100,
        ),
      }) satisfies TotalExpensePerCategory,
  );
  const lastTransactions = await db.transaction.findMany({
    where,
    orderBy: {
      date: "desc",
    },
    take: 15,
  });

  return {
    depositTotal,
    expensesTotal,
    investmentsTotal,
    balanceTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: JSON.parse(JSON.stringify(lastTransactions)),
  };
};

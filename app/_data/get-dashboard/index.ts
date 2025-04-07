import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TransactionPercentagePerType } from "./types";

export const getDashboard = async ({ month }: { month: string }) => {
  const currentYear = new Date().getFullYear();
  const selectedMonth = Number(month) - 1;

  const where = {
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

  return {
    depositTotal,
    expensesTotal,
    investmentsTotal,
    balanceTotal,
    typesPercentage,
  };
};

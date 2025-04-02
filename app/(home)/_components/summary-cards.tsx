import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard from "./summary-card";
import { db } from "@/app/_lib/prisma";

const SummaryCards = async ({ month }: { month: string }) => {
  const currentYear = new Date().getFullYear();
  const selectedMonth = Number(month) - 1; // Ajusta para o índice baseado em zero do JavaScript

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

  return (
    <div className="space-y-6">
      <SummaryCard
        icon={<WalletIcon size={16} />}
        title="Saldo"
        amount={balanceTotal}
        size="large"
      />
      <div className="grid grid-cols-3 gap-6">
        <SummaryCard
          icon={<TrendingUpIcon size={16} className="text-primary" />}
          title="Receita"
          amount={depositTotal}
        />
        <SummaryCard
          icon={<TrendingDownIcon size={16} className="text-red-500" />}
          title="Despesas"
          amount={expensesTotal}
        />
        <SummaryCard
          icon={<PiggyBankIcon size={16} />}
          title="Investido"
          amount={investmentsTotal}
        />
      </div>
    </div>
  );
};

export default SummaryCards;

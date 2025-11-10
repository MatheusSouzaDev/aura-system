import {
  Transaction,
  TransactionCategory,
  TransactionType,
} from "@prisma/client";

export type TransactionPercentagePerType = {
  [key in TransactionType]: number;
};

export interface TotalExpensePerCategory {
  category: TransactionCategory;
  totalAmount: number;
  percentageOfTotal: number;
}

export interface DashboardData {
  depositTotal: number;
  expensesTotal: number;
  investmentsTotal: number;
  balanceTotal: number;
  previousMonthBalance: number;
  balanceDifference: number;
  typesPercentage: TransactionPercentagePerType;
  totalExpensePerCategory: TotalExpensePerCategory[];
  lastTransactions: Transaction[];
}
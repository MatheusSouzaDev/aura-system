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

export interface AccountSummary {
  id: string;
  name: string;
  color: string | null;
  balance: number;
  includeInBalance: boolean;
  includeInCashFlow: boolean;
  includeInInvestments: boolean;
  includeInAiReports: boolean;
  includeInOverview: boolean;
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
  accounts: AccountSummary[];
}

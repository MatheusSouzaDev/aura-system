import { TransactionType } from "@prisma/client";

const TRANSACTION_TYPE_COLOR_MAP: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: "text-primary",
  [TransactionType.EXPENSE]: "text-red-500",
  [TransactionType.INVESTMENT]: "text-white",
};

const TRANSACTION_TYPE_PREFIX_MAP: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: "+",
  [TransactionType.EXPENSE]: "-",
  [TransactionType.INVESTMENT]: "",
};

export const getTransactionAmountColor = (
  transactionType: TransactionType,
): string => TRANSACTION_TYPE_COLOR_MAP[transactionType];

export const getTransactionAmountPrefix = (
  transactionType: TransactionType,
): string => TRANSACTION_TYPE_PREFIX_MAP[transactionType];

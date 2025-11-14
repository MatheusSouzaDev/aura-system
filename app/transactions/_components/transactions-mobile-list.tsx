"use client";

import { useMemo } from "react";
import { AccountOption } from "@/app/_components/add-transaction-button";
import { SerializableTransaction } from "./transactions-board";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_config/transactions";
import {
  getTransactionAmountColor,
  getTransactionAmountPrefix,
} from "@/app/_utils/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import TransactionStatusToggle from "./transaction-status-toggle";

interface TransactionsMobileListProps {
  transactions: SerializableTransaction[];
  accountOptions: AccountOption[];
}

const TransactionsMobileList = ({
  transactions,
  accountOptions,
}: TransactionsMobileListProps) => {
  const accountsMap = useMemo(() => {
    const entries = new Map<string, string>();
    accountOptions.forEach((account) => entries.set(account.id, account.name));
    return entries;
  }, [accountOptions]);

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const amountNumber = Number(transaction.amount);
        const amountColor = getTransactionAmountColor(transaction.type);
        const accountName = transaction.accountId
          ? accountsMap.get(transaction.accountId)
          : null;

        return (
          <div
            key={transaction.id}
            className="rounded-2xl border border-white/5 bg-white/[3%] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{transaction.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {accountName && ` • ${accountName}`}
                </p>
              </div>
              <TransactionStatusToggle transaction={transaction} size="sm" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                {TRANSACTION_CATEGORY_LABELS[transaction.category]}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-muted-foreground">
                {TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
              </span>
              {transaction.installmentCount && transaction.installmentIndex && (
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  Parcela {transaction.installmentIndex}/
                  {transaction.installmentCount}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  Prevista para{" "}
                  {new Date(transaction.date).toLocaleDateString("pt-BR")}
                </p>
                {transaction.executedAt && (
                  <p>
                    Efetuada em{" "}
                    {new Date(transaction.executedAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                )}
              </div>
              <p className={`text-xl font-bold ${amountColor}`}>
                {getTransactionAmountPrefix(transaction.type)}
                {formatCurrency(amountNumber)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionsMobileList;

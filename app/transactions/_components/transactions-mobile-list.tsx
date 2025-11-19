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
import { TransactionStatus, TransactionType } from "@prisma/client";
import EditTransactionButton from "./edit-transaction-button";
import DeleteTransactionButton from "./delete-transaction-button";

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
        const destinationName = transaction.transferAccountId
          ? accountsMap.get(transaction.transferAccountId)
          : null;
        const isExecuted = transaction.status === TransactionStatus.EXECUTED;
        const referenceDate =
          isExecuted && transaction.executedAt
            ? transaction.executedAt
            : transaction.date;
        const dateLabel = isExecuted ? "Efetuada em" : "Prevista para";
        const formattedDateShort = new Date(referenceDate).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "short",
          },
        );
        const formattedDateFull = new Date(referenceDate).toLocaleDateString(
          "pt-BR",
        );

        return (
          <div
            key={transaction.id}
            className="rounded-2xl border border-white/5 bg-white/[3%] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{transaction.name}</p>
                <p className="text-xs text-muted-foreground">
                  {transaction.type === TransactionType.TRANSFER
                    ? `${formattedDateShort} - ${(accountName ?? "Origem") + " -> " + (destinationName ?? "Destino")}`
                    : `${formattedDateShort}${
                        accountName ? ` - ${accountName}` : ""
                      }`}
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
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <div className="text-xs text-muted-foreground">
                  {dateLabel} {formattedDateFull}
                </div>
                <p className={`text-xl font-bold ${amountColor}`}>
                  {getTransactionAmountPrefix(transaction.type)}
                  {formatCurrency(amountNumber)}
                </p>
              </div>
              <div className="flex gap-2">
                <EditTransactionButton
                  transaction={transaction}
                  accounts={accountOptions}
                />
                <DeleteTransactionButton transactionId={transaction.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionsMobileList;

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SerializableTransaction } from "../_components/transactions-board";
import TransactionTypeBadge from "../_components/type-badge";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_config/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import {
  getTransactionAmountColor,
  getTransactionAmountPrefix,
} from "@/app/_utils/transactions";
import EditTransactionButton from "../_components/edit-transaction-button";
import DeleteTransactionButton from "../_components/delete-transaction-button";
import TransactionStatusToggle from "../_components/transaction-status-toggle";
import { AccountOption } from "@/app/_components/add-transaction-button";
import { TransactionStatus, TransactionType } from "@prisma/client";

export const createTransactionColumns = (
  accounts: AccountOption[],
): ColumnDef<SerializableTransaction>[] => {
  const accountMap = new Map(
    accounts.map((account) => [account.id, account.name]),
  );

  return [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row: { original: transaction } }) => {
        const sourceAccount = transaction.accountId
          ? accountMap.get(transaction.accountId)
          : null;
        const destinationAccount =
          transaction.transferAccountId &&
          accountMap.get(transaction.transferAccountId);

        return (
          <div className="flex flex-col">
            <span>{transaction.name}</span>
            {transaction.type === TransactionType.TRANSFER && (
              <span className="text-xs text-muted-foreground">
                {(sourceAccount ?? "Origem") +
                  " → " +
                  (destinationAccount ?? "Destino")}
              </span>
            )}
            {transaction.type !== TransactionType.TRANSFER && sourceAccount && (
              <span className="text-xs text-muted-foreground">
                {sourceAccount}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row: { original: transaction } }) => (
        <TransactionTypeBadge transaction={transaction} />
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row: { original: transaction } }) =>
        TRANSACTION_CATEGORY_LABELS[transaction.category],
    },
    {
      accessorKey: "paymentMethod",
      header: "Método de Pagamento",
      cell: ({ row: { original: transaction } }) =>
        TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row: { original: transaction } }) => {
        const isExecuted = transaction.status === TransactionStatus.EXECUTED;
        const referenceDate =
          isExecuted && transaction.executedAt
            ? transaction.executedAt
            : transaction.date;
        const formattedDate = new Date(referenceDate).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          },
        );

        return (
          <div className="flex flex-col">
            <span>{formattedDate}</span>
            <span className="text-xs text-muted-foreground">
              {isExecuted ? "Efetuada" : "Prevista"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row: { original: transaction } }) => (
        <span
          className={`font-semibold ${getTransactionAmountColor(transaction.type)}`}
        >
          {getTransactionAmountPrefix(transaction.type)}
          {formatCurrency(Number(transaction.amount))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Efetuada?",
      cell: ({ row: { original: transaction } }) => (
        <TransactionStatusToggle transaction={transaction} />
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row: { original: transaction } }) => (
        <div className="space-x-1">
          <EditTransactionButton
            transaction={transaction}
            accounts={accounts}
          />
          <DeleteTransactionButton transactionId={transaction.id} />
        </div>
      ),
    },
  ];
};

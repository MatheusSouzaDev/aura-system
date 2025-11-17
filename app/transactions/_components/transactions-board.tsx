"use client";

import { useMemo, useState } from "react";
import { TransactionStatus, Transaction } from "@prisma/client";
import { AccountOption } from "@/app/_components/add-transaction-button";
import { DataTable } from "@/app/_components/ui/data-table";
import { createTransactionColumns } from "../_columns";
import TransactionsMobileList from "./transactions-mobile-list";

export type SerializableTransaction = Omit<
  Transaction,
  | "amount"
  | "date"
  | "createdAt"
  | "updateAt"
  | "executedAt"
  | "recurrenceEndsAt"
  | "recurrenceSkipWeekdays"
> & {
  amount: number;
  date: string;
  createdAt: string;
  updateAt: string;
  executedAt: string | null;
  recurrenceEndsAt: string | null;
  recurrenceSkipWeekdays: string | null;
};

interface TransactionsBoardProps {
  transactions: SerializableTransaction[];
  accountOptions: AccountOption[];
}

const TransactionsBoard = ({
  transactions,
  accountOptions,
}: TransactionsBoardProps) => {
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>(
    TransactionStatus.EXECUTED,
  );

  const columns = useMemo(
    () => createTransactionColumns(accountOptions),
    [accountOptions],
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => transaction.status === statusFilter),
    [transactions, statusFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Efetuadas"
          isActive={statusFilter === TransactionStatus.EXECUTED}
          onClick={() => setStatusFilter(TransactionStatus.EXECUTED)}
        />
        <FilterChip
          label="Futuras"
          isActive={statusFilter === TransactionStatus.PENDING}
          onClick={() => setStatusFilter(TransactionStatus.PENDING)}
        />
      </div>

      <div className="hidden w-full md:block">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[720px]">
            <DataTable columns={columns} data={filteredTransactions} />
          </div>
        </div>
      </div>

      <div className="block md:hidden">
        <TransactionsMobileList
          transactions={filteredTransactions}
          accountOptions={accountOptions}
        />
      </div>
    </div>
  );
};

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterChip = ({ label, isActive, onClick }: FilterChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
    }`}
  >
    {label}
  </button>
);

export default TransactionsBoard;

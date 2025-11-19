"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import UpsertTransactionDialog from "@/app/_components/upsert-transaction-dialog";
import { AccountOption } from "@/app/_components/add-transaction-button";
import { SerializableTransaction } from "./transactions-board";

interface EditTransactionButtonProps {
  transaction: SerializableTransaction;
  accounts: AccountOption[];
}

const EditTransactionButton = ({
  transaction,
  accounts,
}: EditTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const baseAmount = Number(transaction.amount);
  const normalizedAmount =
    transaction.installmentValueIsTotal && transaction.installmentCount
      ? baseAmount * transaction.installmentCount
      : baseAmount;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => setDialogIsOpen(true)}
      >
        <PencilIcon />
      </Button>
      <UpsertTransactionDialog
        dialogIsOpen={dialogIsOpen}
        setDialogIsOpen={setDialogIsOpen}
        defaultValues={{
          ...transaction,
          date: new Date(transaction.date),
          amount: normalizedAmount,
          accountId: transaction.accountId ?? accounts[0]?.id ?? "",
          transferAccountId: transaction.transferAccountId ?? undefined,
          installmentIndex: transaction.installmentIndex ?? undefined,
          installmentCount: transaction.installmentCount ?? undefined,
          installmentValueIsTotal: transaction.installmentValueIsTotal ?? false,
          recurrenceType: transaction.recurrenceType,
          recurrenceInterval: transaction.recurrenceInterval ?? undefined,
          recurrenceEndsAt: transaction.recurrenceEndsAt
            ? new Date(transaction.recurrenceEndsAt)
            : undefined,
          recurrenceSkipWeekdays: transaction.recurrenceSkipWeekdays
            ? JSON.parse(transaction.recurrenceSkipWeekdays)
            : [],
        }}
        transactionId={transaction.id}
        accounts={accounts}
      />
    </>
  );
};

export default EditTransactionButton;

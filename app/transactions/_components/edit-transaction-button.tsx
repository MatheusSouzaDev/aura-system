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
          amount: Number(transaction.amount),
        }}
        transactionId={transaction.id}
        accounts={accounts}
      />
    </>
  );
};

export default EditTransactionButton;

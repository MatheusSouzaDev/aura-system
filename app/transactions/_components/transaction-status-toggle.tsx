"use client";

import { useMemo, useState, useTransition } from "react";
import { TransactionStatus } from "@prisma/client";
import { CheckIcon, Loader2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { updateTransactionStatus } from "@/app/_actions/update-transaction-status";
import { SerializableTransaction } from "./transactions-board";

interface TransactionStatusToggleProps {
  transaction: SerializableTransaction;
  size?: "sm" | "md";
}

const TransactionStatusToggle = ({
  transaction,
  size = "md",
}: TransactionStatusToggleProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isExecuted = transaction.status === TransactionStatus.EXECUTED;
  const shouldAskForDate = useMemo(() => {
    const plannedDate = new Date(transaction.date);
    const now = new Date();
    return (
      plannedDate.getFullYear() !== now.getFullYear() ||
      plannedDate.getMonth() !== now.getMonth() ||
      plannedDate.getDate() !== now.getDate()
    );
  }, [transaction.date]);

  const handleToggle = () => {
    if (isExecuted) {
      startTransition(async () => {
        await updateTransactionStatus({
          id: transaction.id,
          status: TransactionStatus.PENDING,
        });
      });
      return;
    }

    if (shouldAskForDate) {
      setConfirmOpen(true);
      return;
    }

    markAsExecuted(false);
  };

  const markAsExecuted = (useCurrentDate: boolean) => {
    setConfirmOpen(false);
    startTransition(async () => {
      await updateTransactionStatus({
        id: transaction.id,
        status: TransactionStatus.EXECUTED,
        useCurrentDate,
      });
    });
  };

  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-center rounded-full border ${sizeClasses} ${
          isExecuted
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
            : "border-white/20 text-white/60"
        }`}
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" size={16} />
        ) : isExecuted ? (
          <CheckIcon size={16} />
        ) : (
          <div className="h-2 w-2 rounded-full bg-white/50" />
        )}
      </button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Data diferente da prevista</AlertDialogTitle>
            <AlertDialogDescription>
              Esta transa����o estava marcada para{" "}
              {new Date(transaction.date).toLocaleDateString("pt-BR")}. Deseja
              usar a data atual como data de efetua����o?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
            <AlertDialogCancel
              onClick={() => markAsExecuted(false)}
              className="w-full"
            >
              Usar data prevista
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => markAsExecuted(true)}
              className="w-full"
            >
              Usar data atual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionStatusToggle;

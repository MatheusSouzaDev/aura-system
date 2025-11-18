"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { TransactionStatus } from "@prisma/client";
import { CheckIcon, Loader2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { DatePicker } from "@/app/_components/ui/date-picker";
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
  const plannedDate = useMemo(
    () => new Date(transaction.date),
    [transaction.date],
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(plannedDate);
  const [isPending, startTransition] = useTransition();
  const isExecuted = transaction.status === TransactionStatus.EXECUTED;
  const shouldAskForDate = useMemo(() => {
    const now = new Date();
    return (
      plannedDate.getFullYear() !== now.getFullYear() ||
      plannedDate.getMonth() !== now.getMonth() ||
      plannedDate.getDate() !== now.getDate()
    );
  }, [plannedDate]);

  useEffect(() => {
    setCustomDate(plannedDate);
  }, [plannedDate]);

  useEffect(() => {
    if (confirmOpen) {
      setCustomDate(plannedDate);
    }
  }, [confirmOpen, plannedDate]);

  const plannedDateLabel = useMemo(
    () => plannedDate.toLocaleDateString("pt-BR"),
    [plannedDate],
  );

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
      setCustomDate(plannedDate);
      return;
    }

    markAsExecuted(plannedDate);
  };

  const markAsExecuted = (executedAt: Date) => {
    setConfirmOpen(false);
    startTransition(async () => {
      await updateTransactionStatus({
        id: transaction.id,
        status: TransactionStatus.EXECUTED,
        executedAt,
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
            <AlertDialogTitle>Escolha a data de efetuação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta transação estava prevista para {plannedDateLabel}. Como você
              deseja registrá-la?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-4">
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-lg border border-white/10 p-4 shadow-sm">
                <p className="text-sm font-medium text-white">
                  Usar uma das opções sugeridas
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => markAsExecuted(plannedDate)}
                  >
                    Usar data prevista
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => markAsExecuted(new Date())}
                  >
                    Usar data atual
                  </Button>
                </div>
              </section>
              <section className="rounded-lg border border-white/10 p-4 shadow-sm">
                <p className="text-sm font-medium text-white">
                  Escolher outra data
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <DatePicker
                      value={customDate}
                      onChange={(date) => setCustomDate(date ?? undefined)}
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full md:w-auto"
                    disabled={!customDate || isPending}
                    onClick={() => customDate && markAsExecuted(customDate)}
                  >
                    Confirmar data
                  </Button>
                </div>
              </section>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionStatusToggle;

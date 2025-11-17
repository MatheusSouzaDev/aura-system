"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { TrashIcon } from "lucide-react";
import { deleteTransaction } from "../_actions/delete-transaction";
import { DeleteTransactionScope } from "../_actions/delete-transaction/schema";
import { toast } from "sonner";

interface DeleteTransactionButtonProps {
  transactionId: string;
}

const DeleteTransactionButton = ({
  transactionId,
}: DeleteTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (scope: DeleteTransactionScope) => {
    startTransition(async () => {
      try {
        await deleteTransaction({ transactionId, scope });
        toast.success("Transação deletada com sucesso!");
        setDialogIsOpen(false);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao deletar transação. Tente novamente mais tarde.");
      }
    });
  };

  return (
    <AlertDialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <TrashIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Você deseja realmente deletar essa transação?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Escolha se quer remover apenas esta ocorrência ou toda a série.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-3">
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <div className="grid w-full gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleDelete("CURRENT")}
            >
              Somente esta
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleDelete("FORWARD")}
            >
              Esta e próximas
            </Button>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => handleDelete("ALL")}
            >
              Todas
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTransactionButton;

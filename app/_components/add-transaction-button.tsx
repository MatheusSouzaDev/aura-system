"use client";

import { useState } from "react";
import UpsertTransactionDialog from "./upsert-transaction-dialog";
import { Button } from "./ui/button";
import { ArrowDownUpIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export interface AccountOption {
  id: string;
  name: string;
}

interface AddTransactionButtonProps {
  userCanAddTransaction?: boolean;
  accounts: AccountOption[];
}

const AddTransactionButton = ({
  userCanAddTransaction,
  accounts,
}: AddTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [limitDialogIsOpen, setLimitDialogIsOpen] = useState(false);

  const handleClick = () => {
    if (!userCanAddTransaction) {
      setLimitDialogIsOpen(true);
      return;
    }

    setDialogIsOpen(true);
  };

  return (
    <>
      <Button className="rounded-full font-bold" onClick={handleClick}>
        Adicionar transa��ǜo
        <ArrowDownUpIcon />
      </Button>
      <UpsertTransactionDialog
        dialogIsOpen={dialogIsOpen}
        setDialogIsOpen={setDialogIsOpen}
        accounts={accounts}
      />
      <AlertDialog open={limitDialogIsOpen} onOpenChange={setLimitDialogIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite atingido</AlertDialogTitle>
            <AlertDialogDescription>
              Voc�� atingiu o limite de transa����es do seu plano básico. Faça
              upgrade para continuar registrando suas movimenta����es sem
              restri����o.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setLimitDialogIsOpen(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddTransactionButton;

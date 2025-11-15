"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AccountSummary } from "../_data/get-dashboard/types";
import { saveAccount, deleteAccount } from "../_actions/accounts";
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";

type ManageableAccount = Pick<
  AccountSummary,
  | "id"
  | "name"
  | "color"
  | "includeInBalance"
  | "includeInCashFlow"
  | "includeInInvestments"
  | "includeInAiReports"
  | "includeInOverview"
> & {
  balance?: number;
};

interface ManageAccountsButtonProps {
  accounts: ManageableAccount[];
}

const ACCOUNT_TOGGLE_FIELDS: Array<{
  key: keyof AccountSummary;
  label: string;
  description: string;
}> = [
  {
    key: "includeInBalance",
    label: "Saldo do mês",
    description: "Considera este saldo no cartão principal do dashboard",
  },
  {
    key: "includeInCashFlow",
    label: "Receitas e despesas",
    description: "Inclui as movimentações desta conta nos totais mensais",
  },
  {
    key: "includeInInvestments",
    label: "Investimentos",
    description: "Permite que investimentos desta conta componham o total",
  },
  {
    key: "includeInAiReports",
    label: "Relatórios com IA",
    description: "A IA irá analisar as movimentações desta conta",
  },
  {
    key: "includeInOverview",
    label: "Exibir nos cards",
    description: "Mostra o saldo desta conta nos cards do dashboard",
  },
];

const ManageAccountsButton = ({ accounts }: ManageAccountsButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountColor, setNewAccountColor] = useState("");
  const [isPending, startTransition] = useTransition();

  const orderedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.name.localeCompare(b.name)),
    [accounts],
  );

  const resetForm = () => {
    setNewAccountName("");
    setNewAccountColor("");
  };

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) {
      return;
    }

    startTransition(async () => {
      await saveAccount({
        name: newAccountName.trim(),
        color: newAccountColor ? newAccountColor : null,
      });
      resetForm();
    });
  };

  const handleToggle = (
    account: ManageableAccount,
    field: keyof AccountSummary,
    checked: boolean,
  ) => {
    startTransition(async () => {
      await saveAccount({
        id: account.id,
        name: account.name,
        color: account.color ?? null,
        includeInBalance:
          field === "includeInBalance" ? checked : account.includeInBalance,
        includeInCashFlow:
          field === "includeInCashFlow" ? checked : account.includeInCashFlow,
        includeInInvestments:
          field === "includeInInvestments"
            ? checked
            : account.includeInInvestments,
        includeInAiReports:
          field === "includeInAiReports" ? checked : account.includeInAiReports,
        includeInOverview:
          field === "includeInOverview" ? checked : account.includeInOverview,
      });
    });
  };

  const handleDelete = (accountId: string) => {
    startTransition(async () => {
      await deleteAccount({ id: accountId });
    });
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full font-bold">
          <PlusIcon className="mr-2" size={16} />
          Contas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerenciar contas bancárias</DialogTitle>
          <DialogDescription>
            Adicione novas contas e defina onde cada uma será considerada nas
            métricas do dashboard e nos relatórios de IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          <div className="space-y-4 rounded-md border border-dashed p-4">
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Nova conta
            </p>
            <div className="grid gap-3 sm:grid-cols-[2fr,1fr,auto]">
              <div className="space-y-2">
                <Label htmlFor="account-name">Nome</Label>
                <Input
                  id="account-name"
                  placeholder="Ex.: Banco Inter"
                  value={newAccountName}
                  onChange={(event) => setNewAccountName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-color">Cor (opcional)</Label>
                <Input
                  id="account-color"
                  placeholder="#2ED47A"
                  value={newAccountColor}
                  onChange={(event) => setNewAccountColor(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="w-full font-bold"
                  onClick={handleCreateAccount}
                  disabled={isPending || !newAccountName.trim()}
                >
                  {isPending ? (
                    <Loader2Icon className="animate-spin" size={16} />
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {orderedAccounts.map((account) => (
              <div key={account.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Saldo atual:{" "}
                      <span className="font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(account.balance ?? 0)}
                      </span>
                    </p>
                  </div>
                  {orderedAccounts.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(account.id)}
                      disabled={isPending}
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {ACCOUNT_TOGGLE_FIELDS.map(({ key, label, description }) => (
                    <label
                      key={`${account.id}-${key.toString()}`}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 transition hover:border-white/10"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent"
                        checked={Boolean(account[key])}
                        onChange={(event) =>
                          handleToggle(account, key, event.target.checked)
                        }
                        disabled={isPending}
                      />
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAccountsButton;

"use client";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  TransactionCategory,
  TransactionFulfillmentType,
  TransactionPaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { MoneyInput } from "./money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  PAYMENT_METHOD_OPTIONS,
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "../_config/transactions";
import { DatePicker } from "./ui/date-picker";
import { upsertTransaction } from "../_actions/upsert-transaction";
import { AccountOption } from "./add-transaction-button";

const formSchema = z
  .object({
    name: z.string().trim().min(1, {
      message: "O nome Ǹ obrigat��rio",
    }),
    amount: z
      .number({ required_error: "O valor Ǹ obrigat��rio" })
      .positive({ message: "O valor deve ser positivo" }),
    type: z.nativeEnum(TransactionType, {
      required_error: "O tipo Ǹ obrigat��rio",
    }),
    category: z.nativeEnum(TransactionCategory, {
      required_error: "A categoria Ǹ obrigat��ria",
    }),
    paymentMethod: z.nativeEnum(TransactionPaymentMethod, {
      required_error: "O mǸtodo de pagamento Ǹ obrigat��rio",
    }),
    date: z.date({
      required_error: "A data Ǹ obrigat��ria",
    }),
    accountId: z.string().min(1, "Selecione uma conta"),
    status: z.nativeEnum(TransactionStatus, {
      required_error: "Selecione o status",
    }),
    fulfillmentType: z.nativeEnum(TransactionFulfillmentType, {
      required_error: "Selecione o formato de pagamento",
    }),
    installmentIndex: z.number().int().positive().optional(),
    installmentCount: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.fulfillmentType !== TransactionFulfillmentType.INSTALLMENT) {
        return true;
      }
      return (
        typeof data.installmentCount === "number" &&
        typeof data.installmentIndex === "number" &&
        data.installmentIndex <= data.installmentCount
      );
    },
    {
      message: "Informe o número e total de parcelas",
      path: ["installmentCount"],
    },
  );

type FormSchema = z.infer<typeof formSchema>;

const STATUS_OPTIONS = [
  {
    label: "Efetuada",
    value: TransactionStatus.EXECUTED,
  },
  {
    label: "Prevista",
    value: TransactionStatus.PENDING,
  },
];

const FULFILLMENT_OPTIONS = [
  {
    label: "Pagamento único",
    value: TransactionFulfillmentType.IMMEDIATE,
  },
  {
    label: "Prevista / recorrente",
    value: TransactionFulfillmentType.FORECAST,
  },
  {
    label: "Parcelada",
    value: TransactionFulfillmentType.INSTALLMENT,
  },
];

interface UpsertTransactionDialogProps {
  dialogIsOpen: boolean;
  setDialogIsOpen: (isOpen: boolean) => void;
  defaultValues?: Partial<FormSchema>;
  transactionId?: string;
  accounts: AccountOption[];
}

const UpsertTransactionDialog = ({
  dialogIsOpen,
  defaultValues,
  setDialogIsOpen,
  transactionId,
  accounts,
}: UpsertTransactionDialogProps) => {
  const fallbackAccountId = defaultValues?.accountId ?? accounts[0]?.id ?? "";

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "Nome da transa��ǜo",
      amount: defaultValues?.amount ?? 50,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      type: defaultValues?.type ?? TransactionType.EXPENSE,
      category: defaultValues?.category ?? TransactionCategory.OTHER,
      paymentMethod:
        defaultValues?.paymentMethod ?? TransactionPaymentMethod.CASH,
      accountId: fallbackAccountId,
      status: defaultValues?.status ?? TransactionStatus.EXECUTED,
      fulfillmentType:
        defaultValues?.fulfillmentType ?? TransactionFulfillmentType.IMMEDIATE,
      installmentCount: defaultValues?.installmentCount,
      installmentIndex: defaultValues?.installmentIndex,
    },
  });

  const fulfillmentType = form.watch("fulfillmentType");

  const onSubmit = async (data: FormSchema) => {
    try {
      const payload = {
        ...data,
        installmentCount:
          data.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
            ? data.installmentCount
            : undefined,
        installmentIndex:
          data.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
            ? data.installmentIndex
            : undefined,
        id: transactionId,
      };
      await upsertTransaction(payload);
      setDialogIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  const isUpdate = Boolean(transactionId);

  return (
    <Dialog
      open={dialogIsOpen}
      onOpenChange={(open) => {
        setDialogIsOpen(open);
      }}
    >
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Editar" : "Adicionar"} transa��ǜo
          </DialogTitle>
          <DialogDescription>Insira as informa����es abaixo</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Sal��rio, Aluguel..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue)
                      }
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || fallbackAccountId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data prevista</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fulfillmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FULFILLMENT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {fulfillmentType === TransactionFulfillmentType.INSTALLMENT && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="installmentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total de parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installmentIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcela atual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MǸtodo de pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um mǸtodo de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">{isUpdate ? "Editar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertTransactionDialog;

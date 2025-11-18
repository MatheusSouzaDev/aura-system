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
import { useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  TransactionCategory,
  TransactionFulfillmentType,
  TransactionPaymentMethod,
  TransactionRecurrenceType,
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

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

type RecurrencePreset =
  | "daily_all"
  | "daily_skip_weekends"
  | "daily_custom"
  | TransactionRecurrenceType;

const RECURRENCE_PRESET_OPTIONS: { label: string; value: RecurrencePreset }[] =
  [
    { label: "Não repetir", value: TransactionRecurrenceType.NONE },
    { label: "Diariamente", value: "daily_all" },
    {
      label: "Diariamente (exceto fins de semana)",
      value: "daily_skip_weekends",
    },
    { label: "Diariamente (personalizado)", value: "daily_custom" },
    { label: "Semanalmente", value: TransactionRecurrenceType.WEEKLY },
    { label: "Mensalmente", value: TransactionRecurrenceType.MONTHLY },
    { label: "Anualmente", value: TransactionRecurrenceType.YEARLY },
    { label: "Personalizado (dias)", value: TransactionRecurrenceType.CUSTOM },
  ];

const formSchema = z
  .object({
    name: z.string().trim().min(1, {
      message: "O nome é obrigatório",
    }),
    amount: z
      .number({ required_error: "O valor é obrigatório" })
      .positive({ message: "O valor deve ser positivo" }),
    type: z.nativeEnum(TransactionType, {
      required_error: "O tipo é obrigatório",
    }),
    category: z.nativeEnum(TransactionCategory, {
      required_error: "A categoria é obrigatória",
    }),
    paymentMethod: z.nativeEnum(TransactionPaymentMethod, {
      required_error: "O metodo de pagamento é obrigatório",
    }),
    date: z.date({
      required_error: "A data é obrigatória",
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
    installmentValueIsTotal: z.boolean().optional(),
    recurrenceType: z.nativeEnum(TransactionRecurrenceType),
    recurrenceInterval: z.number().int().positive().optional(),
    recurrenceEndsAt: z.date().optional(),
    recurrenceSkipWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === TransactionFulfillmentType.INSTALLMENT) {
      if (
        typeof data.installmentCount !== "number" ||
        typeof data.installmentIndex !== "number" ||
        data.installmentIndex > data.installmentCount
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o número e total de parcelas",
          path: ["installmentCount"],
        });
      }
    }

    if (data.fulfillmentType !== TransactionFulfillmentType.FORECAST) {
      return;
    }

    if (data.recurrenceType === TransactionRecurrenceType.NONE) {
      return;
    }

    if (data.recurrenceEndsAt && data.recurrenceEndsAt <= data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data final deve ser posterior a data inicial",
        path: ["recurrenceEndsAt"],
      });
    }

    if (
      data.recurrenceType === TransactionRecurrenceType.CUSTOM &&
      !data.recurrenceInterval
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o intervalo em dias",
        path: ["recurrenceInterval"],
      });
    }

    if (
      data.recurrenceType === TransactionRecurrenceType.DAILY &&
      data.recurrenceSkipWeekdays &&
      data.recurrenceSkipWeekdays.length === WEEKDAY_OPTIONS.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione pelo menos um dia para repetir",
        path: ["recurrenceSkipWeekdays"],
      });
    }
  });

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
    label: "Recorrente",
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
      name: defaultValues?.name ?? "Nome da transação",
      amount: defaultValues?.amount ?? 50,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      type: defaultValues?.type ?? TransactionType.EXPENSE,
      category: defaultValues?.category ?? TransactionCategory.OTHER,
      paymentMethod:
        defaultValues?.paymentMethod ?? TransactionPaymentMethod.CASH,
      accountId: fallbackAccountId,
      status: defaultValues?.status ?? TransactionStatus.PENDING,
      fulfillmentType:
        defaultValues?.fulfillmentType ?? TransactionFulfillmentType.IMMEDIATE,
      installmentCount: defaultValues?.installmentCount,
      installmentIndex: defaultValues?.installmentIndex,
      installmentValueIsTotal: defaultValues?.installmentValueIsTotal ?? false,
      recurrenceType:
        defaultValues?.recurrenceType ?? TransactionRecurrenceType.NONE,
      recurrenceInterval: defaultValues?.recurrenceInterval,
      recurrenceEndsAt: defaultValues?.recurrenceEndsAt
        ? new Date(defaultValues.recurrenceEndsAt)
        : undefined,
      recurrenceSkipWeekdays: defaultValues?.recurrenceSkipWeekdays ?? [],
    },
  });

  const fulfillmentType = form.watch("fulfillmentType");
  const recurrenceType = form.watch("recurrenceType");
  const watchedRecurrenceSkipWeekdays = form.watch("recurrenceSkipWeekdays");
  const recurrenceSkipWeekdays = useMemo(
    () => watchedRecurrenceSkipWeekdays ?? [],
    [watchedRecurrenceSkipWeekdays],
  );
  const transactionDate = form.watch("date");

  const recurrencePreset = useMemo<RecurrencePreset>(() => {
    if (recurrenceType === TransactionRecurrenceType.DAILY) {
      if (!recurrenceSkipWeekdays.length) {
        return "daily_all";
      }
      const sorted = [...recurrenceSkipWeekdays].sort();
      if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) {
        return "daily_skip_weekends";
      }
      return "daily_custom";
    }

    return recurrenceType;
  }, [recurrenceType, recurrenceSkipWeekdays]);

  const handleRecurrencePresetChange = (
    preset: RecurrencePreset,
    onChange: (value: TransactionRecurrenceType) => void,
  ) => {
    if (preset === "daily_all") {
      onChange(TransactionRecurrenceType.DAILY);
      form.setValue("recurrenceSkipWeekdays", [], { shouldDirty: true });
      return;
    }

    if (preset === "daily_skip_weekends") {
      onChange(TransactionRecurrenceType.DAILY);
      form.setValue("recurrenceSkipWeekdays", [0, 6], { shouldDirty: true });
      return;
    }

    if (preset === "daily_custom") {
      onChange(TransactionRecurrenceType.DAILY);

      if (recurrenceSkipWeekdays.length) {
        form.setValue("recurrenceSkipWeekdays", recurrenceSkipWeekdays, {
          shouldDirty: true,
        });
        return;
      }

      const baseWeekday =
        transactionDate instanceof Date
          ? transactionDate.getDay()
          : new Date().getDay();
      const skipOthers = WEEKDAY_OPTIONS.filter(
        (weekday) => weekday.value !== baseWeekday,
      ).map((weekday) => weekday.value);

      form.setValue("recurrenceSkipWeekdays", skipOthers, {
        shouldDirty: true,
      });
      return;
    }

    onChange(preset as TransactionRecurrenceType);
    form.setValue("recurrenceSkipWeekdays", [], { shouldDirty: true });
  };

  const onSubmit = async (data: FormSchema) => {
    try {
      const isInstallment =
        data.fulfillmentType === TransactionFulfillmentType.INSTALLMENT;
      const isForecast =
        data.fulfillmentType === TransactionFulfillmentType.FORECAST;
      const isDailyForecast =
        isForecast && data.recurrenceType === TransactionRecurrenceType.DAILY;

      const payload = {
        ...data,
        installmentCount: isInstallment ? data.installmentCount : undefined,
        installmentIndex: isInstallment ? data.installmentIndex : undefined,
        installmentValueIsTotal: isInstallment
          ? (data.installmentValueIsTotal ?? false)
          : false,
        recurrenceType: isForecast
          ? data.recurrenceType
          : TransactionRecurrenceType.NONE,
        recurrenceInterval:
          isForecast && data.recurrenceType === TransactionRecurrenceType.CUSTOM
            ? data.recurrenceInterval
            : undefined,
        recurrenceEndsAt:
          isForecast && data.recurrenceType !== TransactionRecurrenceType.NONE
            ? data.recurrenceEndsAt
            : undefined,
        recurrenceSkipWeekdays: isDailyForecast
          ? (data.recurrenceSkipWeekdays ?? [])
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
            {isUpdate ? "Editar" : "Adicionar"} transação
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar sua movimentação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Salário, aluguel..." {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
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
                          <SelectValue placeholder="Selecione o status" />
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

            {fulfillmentType === TransactionFulfillmentType.INSTALLMENT && (
              <FormField
                control={form.control}
                name="installmentValueIsTotal"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-lg border border-white/10 p-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium">
                        Valor informado e o total da compra?
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Dividiremos automaticamente pelo número de parcelas ao
                        salvar.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {fulfillmentType === TransactionFulfillmentType.FORECAST && (
              <>
                <FormField
                  control={form.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recorrência</FormLabel>
                      <Select
                        value={recurrencePreset}
                        onValueChange={(value) =>
                          handleRecurrencePresetChange(
                            value as RecurrencePreset,
                            field.onChange,
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a recorrência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RECURRENCE_PRESET_OPTIONS.map((option) => (
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

                {recurrencePreset === "daily_custom" && (
                  <FormField
                    control={form.control}
                    name="recurrenceSkipWeekdays"
                    render={({ field }) => {
                      const skippedWeekdays = field.value ?? [];
                      return (
                        <FormItem>
                          <FormLabel>Dias da semana</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {WEEKDAY_OPTIONS.map((weekday) => {
                              const isSelected = !skippedWeekdays.includes(
                                weekday.value,
                              );
                              return (
                                <Button
                                  key={weekday.value}
                                  type="button"
                                  variant={isSelected ? "default" : "outline"}
                                  className="h-9 px-3 text-sm"
                                  onClick={() => {
                                    const nextSkipped = isSelected
                                      ? [...skippedWeekdays, weekday.value]
                                      : skippedWeekdays.filter(
                                          (day) => day !== weekday.value,
                                        );
                                    if (
                                      nextSkipped.length ===
                                      WEEKDAY_OPTIONS.length
                                    ) {
                                      return;
                                    }
                                    field.onChange(
                                      nextSkipped.sort((a, b) => a - b),
                                    );
                                  }}
                                >
                                  {weekday.label}
                                </Button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Selecione os dias em que a transação deve acontecer.
                          </p>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                {recurrenceType === TransactionRecurrenceType.CUSTOM && (
                  <FormField
                    control={form.control}
                    name="recurrenceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo (em dias)</FormLabel>
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
                )}

                {recurrenceType !== TransactionRecurrenceType.NONE && (
                  <FormField
                    control={form.control}
                    name="recurrenceEndsAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Data final da recorrência (opcional)
                        </FormLabel>
                        <DatePicker
                          value={field.value}
                          onChange={(date) => field.onChange(date)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
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
                  <FormLabel>Método de pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um método de pagamento" />
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

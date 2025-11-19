import {
  TransactionCategory,
  TransactionFulfillmentType,
  TransactionPaymentMethod,
  TransactionRecurrenceType,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z
  .object({
    name: z.string().trim().min(1),
    amount: z.number().positive(),
    type: z.nativeEnum(TransactionType),
    category: z.nativeEnum(TransactionCategory),
    paymentMethod: z.nativeEnum(TransactionPaymentMethod),
    date: z.date(),
    accountId: z.string().uuid(),
    transferAccountId: z.string().uuid().optional().nullable(),
    status: z.nativeEnum(TransactionStatus),
    fulfillmentType: z.nativeEnum(TransactionFulfillmentType),
    installmentIndex: z.number().min(1).optional(),
    installmentCount: z.number().min(1).optional(),
    installmentValueIsTotal: z.boolean().optional(),
    recurrenceType: z.nativeEnum(TransactionRecurrenceType),
    recurrenceInterval: z.number().int().min(1).optional().nullable(),
    recurrenceEndsAt: z.date().optional().nullable(),
    recurrenceSkipWeekdays: z
      .array(z.number().int().min(0).max(6))
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === TransactionType.TRANSFER) {
      if (!data.transferAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione a conta de destino",
          path: ["transferAccountId"],
        });
      } else if (data.transferAccountId === data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "As contas devem ser diferentes",
          path: ["transferAccountId"],
        });
      }

      if (data.fulfillmentType !== TransactionFulfillmentType.IMMEDIATE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transferencias devem ser imediatas",
          path: ["fulfillmentType"],
        });
      }
    }

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
      Array.isArray(data.recurrenceSkipWeekdays) &&
      data.recurrenceSkipWeekdays.length === 7
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione pelo menos um dia para repetir",
        path: ["recurrenceSkipWeekdays"],
      });
    }
  });

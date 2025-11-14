import {
  TransactionCategory,
  TransactionFulfillmentType,
  TransactionPaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod),
  date: z.date(),
  accountId: z.string().uuid(),
  status: z.nativeEnum(TransactionStatus),
  fulfillmentType: z.nativeEnum(TransactionFulfillmentType),
  installmentIndex: z.number().min(1).optional(),
  installmentCount: z.number().min(1).optional(),
});

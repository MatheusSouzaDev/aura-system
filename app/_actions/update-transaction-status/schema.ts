import { TransactionStatus } from "@prisma/client";
import { z } from "zod";

export const updateTransactionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(TransactionStatus),
  useCurrentDate: z.boolean().optional(),
});

export type UpdateTransactionStatusInput = z.infer<
  typeof updateTransactionStatusSchema
>;

import { z } from "zod";

export const deleteTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  scope: z.enum(["CURRENT", "FORWARD", "ALL"]),
});

export type DeleteTransactionSchema = z.infer<typeof deleteTransactionSchema>;
export type DeleteTransactionScope = DeleteTransactionSchema["scope"];

"use server";

import { db } from "@/app/_lib/prisma";
import { deleteTransactionSchema, DeleteTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async (input: DeleteTransactionSchema) => {
  const { transactionId, scope } = deleteTransactionSchema.parse(input);
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { parentTransactionId: true, date: true },
  });

  if (!transaction) {
    return;
  }

  const rootTransactionId = transaction.parentTransactionId ?? transactionId;

  if (scope === "CURRENT") {
    await db.transaction.delete({
      where: { id: transactionId },
    });
  } else if (scope === "ALL") {
    await db.transaction.deleteMany({
      where: {
        OR: [
          { id: rootTransactionId },
          { parentTransactionId: rootTransactionId },
        ],
      },
    });
  } else {
    await db.transaction.deleteMany({
      where: {
        OR: [
          { id: transactionId },
          {
            parentTransactionId: rootTransactionId,
            date: { gte: transaction.date },
          },
        ],
      },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/");
};

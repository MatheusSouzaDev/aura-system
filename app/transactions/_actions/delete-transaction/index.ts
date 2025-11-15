"use server";

import { db } from "@/app/_lib/prisma";
import { DeleteTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async ({
  transactionId,
}: DeleteTransactionSchema) => {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { parentTransactionId: true },
  });

  if (!transaction) {
    return;
  }

  if (transaction.parentTransactionId) {
    await db.transaction.delete({
      where: { id: transactionId },
    });
  } else {
    await db.transaction.deleteMany({
      where: {
        OR: [{ id: transactionId }, { parentTransactionId: transactionId }],
      },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/");
};

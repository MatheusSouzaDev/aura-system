"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { updateTransactionStatusSchema } from "./schema";
import { TransactionStatus } from "@prisma/client";

export const updateTransactionStatus = async (input: {
  id: string;
  status: TransactionStatus;
  useCurrentDate?: boolean;
}) => {
  const data = updateTransactionStatusSchema.parse(input);
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const transaction = await db.transaction.findFirst({
    where: {
      id: data.id,
      userId,
    },
  });

  if (!transaction) {
    throw new Error("Transação não encontrada");
  }

  const executedAt =
    data.status === TransactionStatus.EXECUTED
      ? data.useCurrentDate
        ? new Date()
        : transaction.date
      : null;

  await db.transaction.update({
    where: {
      id: transaction.id,
    },
    data: {
      status: data.status,
      executedAt,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
};

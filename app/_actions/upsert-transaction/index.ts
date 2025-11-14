"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionFulfillmentType,
  TransactionStatus,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

interface UpsertTransactionParams {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
  accountId: string;
  status: TransactionStatus;
  fulfillmentType: TransactionFulfillmentType;
  installmentIndex?: number;
  installmentCount?: number;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const executedAt =
    params.status === TransactionStatus.EXECUTED ? params.date : null;
  await db.transaction.upsert({
    update: {
      ...params,
      installmentIndex:
        params.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
          ? params.installmentIndex
          : null,
      installmentCount:
        params.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
          ? params.installmentCount
          : null,
      executedAt,
      userId,
    },
    create: {
      ...params,
      installmentIndex:
        params.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
          ? params.installmentIndex
          : null,
      installmentCount:
        params.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
          ? params.installmentCount
          : null,
      executedAt,
      userId,
    },
    where: { id: params.id ?? "" },
  });
  revalidatePath("/transactions");
  revalidatePath("/");
};

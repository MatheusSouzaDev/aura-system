"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionFulfillmentType,
  TransactionStatus,
  TransactionRecurrenceType,
  Transaction,
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
  recurrenceType: TransactionRecurrenceType;
  recurrenceInterval?: number | null;
  recurrenceEndsAt?: Date | null;
  recurrenceSkipWeekdays?: number[] | null;
  installmentValueIsTotal?: boolean;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { recurrenceSkipWeekdays, installmentValueIsTotal, ...safeParams } =
    params;
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const shouldSplitInstallmentValue =
    safeParams.fulfillmentType === TransactionFulfillmentType.INSTALLMENT &&
    Boolean(installmentValueIsTotal) &&
    typeof safeParams.installmentCount === "number" &&
    safeParams.installmentCount > 0;

  const normalizedAmount = shouldSplitInstallmentValue
    ? safeParams.amount / (safeParams.installmentCount as number)
    : safeParams.amount;

  const shouldPersistInstallmentFlag =
    safeParams.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
      ? Boolean(installmentValueIsTotal)
      : false;

  const executedAt =
    safeParams.status === TransactionStatus.EXECUTED ? safeParams.date : null;
  const normalizedInstallmentIndex =
    safeParams.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
      ? (safeParams.installmentIndex ?? 1)
      : null;
  const normalizedInstallmentCount =
    safeParams.fulfillmentType === TransactionFulfillmentType.INSTALLMENT
      ? (safeParams.installmentCount ?? null)
      : null;
  const normalizedRecurrenceInterval =
    safeParams.recurrenceType === TransactionRecurrenceType.CUSTOM
      ? (safeParams.recurrenceInterval ?? 1)
      : null;
  const normalizedRecurrenceEndsAt =
    safeParams.recurrenceType === TransactionRecurrenceType.NONE
      ? null
      : (safeParams.recurrenceEndsAt ?? null);

  const recurrenceSkipWeekdaysString =
    recurrenceSkipWeekdays && recurrenceSkipWeekdays.length
      ? JSON.stringify(recurrenceSkipWeekdays)
      : null;

  const baseTransactionData = {
    ...safeParams,
    amount: normalizedAmount,
    installmentValueIsTotal: shouldPersistInstallmentFlag,
  };

  const savedTransaction = await db.transaction.upsert({
    update: {
      ...baseTransactionData,
      installmentIndex: normalizedInstallmentIndex,
      installmentCount: normalizedInstallmentCount,
      recurrenceType: params.recurrenceType,
      recurrenceInterval: normalizedRecurrenceInterval,
      recurrenceEndsAt: normalizedRecurrenceEndsAt,
      recurrenceSkipWeekdays: recurrenceSkipWeekdaysString,
      executedAt,
      userId,
    },
    create: {
      ...baseTransactionData,
      installmentIndex: normalizedInstallmentIndex,
      installmentCount: normalizedInstallmentCount,
      recurrenceType: params.recurrenceType,
      recurrenceInterval: normalizedRecurrenceInterval,
      recurrenceEndsAt: normalizedRecurrenceEndsAt,
      recurrenceSkipWeekdays: recurrenceSkipWeekdaysString,
      executedAt,
      userId,
    },
    where: { id: params.id ?? "" },
  });

  await syncRelatedTransactions(savedTransaction);
  revalidatePath("/transactions");
  revalidatePath("/");
};

const syncRelatedTransactions = async (transaction: Transaction) => {
  if (transaction.parentTransactionId) {
    return;
  }

  await db.transaction.deleteMany({
    where: {
      parentTransactionId: transaction.id,
    },
  });

  if (
    transaction.fulfillmentType === TransactionFulfillmentType.INSTALLMENT &&
    transaction.installmentCount &&
    (transaction.installmentIndex ?? 1) < transaction.installmentCount
  ) {
    await createInstallmentChildren(transaction);
  }

  if (
    transaction.recurrenceType !== TransactionRecurrenceType.NONE &&
    transaction.recurrenceEndsAt
  ) {
    await createRecurringChildren(transaction);
  }
};

const createInstallmentChildren = async (transaction: Transaction) => {
  const totalInstallments = transaction.installmentCount ?? 0;
  const currentIndex = transaction.installmentIndex ?? 1;
  const remaining = totalInstallments - currentIndex;

  if (remaining <= 0) {
    return;
  }

  const baseDate = new Date(transaction.date);

  const data = Array.from({ length: remaining }, (_, idx) => {
    const occurrenceIndex = currentIndex + idx + 1;
    const occurrenceDate = addMonths(baseDate, idx + 1);

    return {
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      paymentMethod: transaction.paymentMethod,
      date: occurrenceDate,
      executedAt: null,
      status: TransactionStatus.PENDING,
      fulfillmentType: TransactionFulfillmentType.INSTALLMENT,
      installmentIndex: occurrenceIndex,
      installmentCount: totalInstallments,
      accountId: transaction.accountId,
      userId: transaction.userId,
      parentTransactionId: transaction.id,
      recurrenceType: TransactionRecurrenceType.NONE,
      recurrenceInterval: null,
      recurrenceEndsAt: null,
    };
  });

  await db.transaction.createMany({
    data,
  });
};

const createRecurringChildren = async (transaction: Transaction) => {
  const endDate = transaction.recurrenceEndsAt;
  if (!endDate) {
    return;
  }

  const maxOccurrences = 120;
  const occurrences: Date[] = [];
  let iterations = 0;
  let cursor = new Date(transaction.date);
  let nextDate = getNextRecurrenceDate(
    cursor,
    transaction.recurrenceType,
    transaction.recurrenceInterval,
  );

  while (nextDate && nextDate <= endDate && iterations < maxOccurrences) {
    occurrences.push(nextDate);
    cursor = nextDate;
    nextDate = getNextRecurrenceDate(
      cursor,
      transaction.recurrenceType,
      transaction.recurrenceInterval,
    );
    iterations += 1;
  }

  if (!occurrences.length) {
    return;
  }

  const data = occurrences.map((occurrenceDate) => ({
    name: transaction.name,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    paymentMethod: transaction.paymentMethod,
    date: occurrenceDate,
    executedAt: null,
    status: TransactionStatus.PENDING,
    fulfillmentType: transaction.fulfillmentType,
    installmentIndex: null,
    installmentCount: null,
    accountId: transaction.accountId,
    userId: transaction.userId,
    parentTransactionId: transaction.id,
    recurrenceType: TransactionRecurrenceType.NONE,
    recurrenceInterval: null,
    recurrenceEndsAt: null,
  }));

  await db.transaction.createMany({
    data,
  });
};

const getNextRecurrenceDate = (
  currentDate: Date,
  recurrenceType: TransactionRecurrenceType,
  recurrenceInterval?: number | null,
) => {
  const base = new Date(currentDate);
  switch (recurrenceType) {
    case TransactionRecurrenceType.DAILY:
      return addDays(base, 1);
    case TransactionRecurrenceType.WEEKLY:
      return addDays(base, 7);
    case TransactionRecurrenceType.MONTHLY:
      return addMonths(base, 1);
    case TransactionRecurrenceType.YEARLY:
      return addYears(base, 1);
    case TransactionRecurrenceType.CUSTOM:
      return addDays(
        base,
        recurrenceInterval && recurrenceInterval > 0 ? recurrenceInterval : 1,
      );
    default:
      return null;
  }
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date: Date, years: number) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

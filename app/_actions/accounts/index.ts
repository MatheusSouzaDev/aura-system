"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import {
  AccountSettingsInput,
  accountSettingsSchema,
  deleteAccountSchema,
} from "./schema";

const invalidateAccountDependents = () => {
  revalidatePath("/");
  revalidatePath("/transactions");
};

export const saveAccount = async (input: AccountSettingsInput) => {
  const data = accountSettingsSchema.parse(input);
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const commonData = {
    name: data.name,
    color: data.color,
    includeInBalance: data.includeInBalance ?? true,
    includeInCashFlow: data.includeInCashFlow ?? true,
    includeInInvestments: data.includeInInvestments ?? true,
    includeInAiReports: data.includeInAiReports ?? true,
    includeInOverview: data.includeInOverview ?? true,
  };

  if (data.id) {
    await db.account.update({
      where: {
        id: data.id,
        userId,
      },
      data: commonData,
    });
  } else {
    await db.account.create({
      data: {
        ...commonData,
        userId,
      },
    });
  }

  invalidateAccountDependents();
};

export const deleteAccount = async (input: { id: string }) => {
  const data = deleteAccountSchema.parse(input);
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const accountsCount = await db.account.count({
    where: { userId },
  });

  if (accountsCount <= 1) {
    throw new Error("Mantenha pelo menos uma conta ativa");
  }

  const fallbackAccount = await db.account.findFirst({
    where: {
      userId,
      NOT: { id: data.id },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!fallbackAccount) {
    throw new Error("Nenhuma conta alternativa encontrada");
  }

  await db.transaction.updateMany({
    where: {
      userId,
      accountId: data.id,
    },
    data: {
      accountId: fallbackAccount.id,
    },
  });

  await db.account.delete({
    where: {
      id: data.id,
      userId,
    },
  });

  invalidateAccountDependents();
};

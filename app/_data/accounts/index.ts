import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export const ensureDefaultAccount = async (userId: string) => {
  const existingAccounts = await db.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (!existingAccounts.length) {
    const defaultAccount = await db.account.create({
      data: {
        name: "Conta principal",
        includeInBalance: true,
        includeInCashFlow: true,
        includeInInvestments: true,
        includeInAiReports: true,
        includeInOverview: true,
        userId,
      },
    });
    return [defaultAccount];
  }

  return existingAccounts;
};

export const getAccountsForUserId = async (userId: string) => {
  const accounts = await ensureDefaultAccount(userId);
  const primaryAccount = accounts[0];

  if (primaryAccount) {
    await db.transaction.updateMany({
      where: {
        userId,
        accountId: null,
      },
      data: {
        accountId: primaryAccount.id,
      },
    });
  }

  return accounts;
};

export const getUserAccounts = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getAccountsForUserId(userId);
};

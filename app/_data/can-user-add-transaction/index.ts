import { auth, clerkClient } from "@clerk/nextjs/server";
import { getCurrentMonthTransactions } from "../get-current-month-transactions";
import { getActiveSubscriptionPlan } from "@/app/_constants/subscription-plans";

export const canUserAddTransaction = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("unauthorized");
  }
  const user = await clerkClient.users.getUser(userId);
  const activePlan = getActiveSubscriptionPlan(
    (user.publicMetadata.subscriptionPlan as string | undefined) ?? undefined,
  );

  if (!activePlan.capabilities.transactionsLimit) {
    return true;
  }
  const currentMonthTransactions = await getCurrentMonthTransactions();
  return currentMonthTransactions < activePlan.capabilities.transactionsLimit;
};

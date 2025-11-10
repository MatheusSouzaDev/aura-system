import { getDashboardContext } from "../dashboard-context";
import { db } from "@/app/_lib/prisma";

export const getCurrentMonthTransactions = async () => {
  const { userId, currentPeriod } = await getDashboardContext();
  
  return db.transaction.count({
    where: {
      userId,
      createdAt: {
        gte: currentPeriod.start,
        lte: currentPeriod.end,
      },
    },
  });
};

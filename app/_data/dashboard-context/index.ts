import { auth } from "@clerk/nextjs/server";

interface DashboardContextParams {
  month?: string | number;
  year?: string | number;
}

interface DashboardContextResult {
  userId: string;
  currentPeriod: {
    start: Date;
    end: Date;
  };
  previousPeriod: {
    start: Date;
    end: Date;
  };
  month: number;
  year: number;
}

export const getDashboardContext = async (
  params: DashboardContextParams = {},
): Promise<DashboardContextResult> => {
  const { month, year } = params;
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentDate = new Date();
  const parsedMonth =
    month !== undefined ? Number(month) : currentDate.getMonth() + 1;
  const parsedYear =
    year !== undefined ? Number(year) : currentDate.getFullYear();

  const normalizedMonth = Math.trunc(parsedMonth);
  const selectedMonth =
    Number.isFinite(normalizedMonth) &&
    normalizedMonth >= 1 &&
    normalizedMonth <= 12
      ? normalizedMonth
      : currentDate.getMonth() + 1;
  const selectedYear = Number.isFinite(parsedYear)
    ? parsedYear
    : currentDate.getFullYear();

  const currentStart = new Date(selectedYear, selectedMonth - 1, 1);
  const currentEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const previousMonthDate = new Date(currentStart);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

  const previousStart = new Date(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
    1,
  );
  const previousEnd = new Date(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return {
    userId,
    currentPeriod: {
      start: currentStart,
      end: currentEnd,
    },
    previousPeriod: {
      start: previousStart,
      end: previousEnd,
    },
    month: selectedMonth,
    year: selectedYear,
  };
};

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "../_components/time-select";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getDashboard } from "../_data/get-dashboard";
import ExpensePerCategory from "./_components/expense-per-category";
import LastTransactions from "./_components/last-transactions";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import AiReportButton from "./_components/ai-report-button";
import { getActiveSubscriptionPlan } from "../_constants/subscription-plans";

interface HomeSearchParams {
  month?: string;
  year?: string;
}

const Home = async ({ searchParams }: { searchParams: HomeSearchParams }) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const now = new Date();
  const currentMonth = searchParams.month || String(now.getMonth() + 1);
  const currentYear = searchParams.year || String(now.getFullYear());
  const dashboard = await getDashboard({
    month: currentMonth,
    year: currentYear,
  });
  const userCanAddTransaction = await canUserAddTransaction();
  const user = await clerkClient.users.getUser(userId);
  const activePlan = getActiveSubscriptionPlan(
    (user.publicMetadata.subscriptionPlan as string | undefined) ?? undefined,
  );

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col gap-6 overflow-x-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto sm:ml-auto sm:w-auto sm:justify-end">
            <div className="shrink-0">
              <AiReportButton
                month={currentMonth}
                year={currentYear}
                hasAiReportAccess={activePlan.capabilities.aiReports}
              />
            </div>
            <TimeSelect
              month={currentMonth}
              year={currentYear}
              basePath="/"
              className="min-w-0 flex-1 sm:flex-initial"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <SummaryCards
              {...dashboard}
              userCanAddTransaction={userCanAddTransaction}
            />
            <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-3">
              <TransactionsPieChart {...dashboard} />
              <ExpensePerCategory
                expensesPerCategory={dashboard.totalExpensePerCategory}
              />
            </div>
          </div>
          <div className="min-w-0">
            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getDashboard } from "../_data/get-dashboard";
import ExpensePerCategory from "./_components/expense-per-category";
import LastTransactions from "./_components/last-transactions";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import AiReportButton from "./_components/ai-report-button";

const Home = async ({ searchParams }: { searchParams: { month?: string } }) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const currentMonth = searchParams.month || String(new Date().getMonth() + 1);
  const dashboard = await getDashboard({
    month: currentMonth,
  });
  const userCanAddTransaction = await canUserAddTransaction();
  const user = await clerkClient.users.getUser(userId);

  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col gap-6 overflow-x-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <AiReportButton
              month={currentMonth}
              hasPlusPlan={user.publicMetadata.subscriptionPlan == "plus"}
            />
            <TimeSelect month={currentMonth} />
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

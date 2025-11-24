import { db } from "../_lib/prisma";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import { getUserAccounts } from "../_data/accounts";
import ManageAccountsButton from "../_components/manage-accounts-button";
import { TransactionStatus, TransactionType } from "@prisma/client";
import TransactionsBoard from "./_components/transactions-board";
import { getDashboardContext } from "../_data/dashboard-context";

interface TransactionsPageProps {
  searchParams?: {
    month?: string;
    year?: string;
  };
}

const TransactionsPage = async ({ searchParams }: TransactionsPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const { currentPeriod } = await getDashboardContext({
    month: searchParams?.month,
    year: searchParams?.year,
  });

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      OR: [
        {
          executedAt: {
            gte: currentPeriod.start,
            lte: currentPeriod.end,
          },
        },
        {
          AND: [
            {
              OR: [
                { executedAt: null },
                { executedAt: { lt: currentPeriod.start } },
              ],
            },
            {
              date: {
                gte: currentPeriod.start,
                lte: currentPeriod.end,
              },
            },
          ],
        },
      ],
    },
  });

  const userCanAddTransaction = await canUserAddTransaction();
  const accounts = await getUserAccounts();
  const accountOptions = accounts.map((account) => ({
    id: account.id,
    name: account.name,
  }));

  const executedBalances = transactions
    .filter((transaction) => transaction.status === TransactionStatus.EXECUTED)
    .reduce<Record<string, number>>((totals, transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.type === TransactionType.TRANSFER) {
        if (transaction.accountId) {
          const currentSourceTotal = totals[transaction.accountId] ?? 0;
          totals[transaction.accountId] = currentSourceTotal - amount;
        }
        if (transaction.transferAccountId) {
          const currentDestinationTotal =
            totals[transaction.transferAccountId] ?? 0;
          totals[transaction.transferAccountId] =
            currentDestinationTotal + amount;
        }
        return totals;
      }

      if (!transaction.accountId) {
        return totals;
      }
      const currentTotal = totals[transaction.accountId] ?? 0;
      const nextTotal =
        transaction.type === TransactionType.DEPOSIT
          ? currentTotal + amount
          : currentTotal - amount;
      totals[transaction.accountId] = nextTotal;
      return totals;
    }, {});

  const manageableAccounts = accounts.map((account) => ({
    ...account,
    balance: executedBalances[account.id] ?? 0,
  }));

  const serializedTransactions = transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
    date: transaction.date.toISOString(),
    executedAt: transaction.executedAt
      ? transaction.executedAt.toISOString()
      : null,
    createdAt: transaction.createdAt.toISOString(),
    updateAt: transaction.updateAt.toISOString(),
    recurrenceEndsAt: transaction.recurrenceEndsAt
      ? transaction.recurrenceEndsAt.toISOString()
      : null,
    recurrenceSkipWeekdays: transaction.recurrenceSkipWeekdays,
  }));

  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-6 overflow-x-hidden px-4 py-3 sm:p-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Transações</h1>
          <div className="flex flex-wrap gap-2">
            <ManageAccountsButton accounts={manageableAccounts} />
            <AddTransactionButton
              userCanAddTransaction={userCanAddTransaction}
              accounts={accountOptions}
            />
          </div>
        </div>
        <TransactionsBoard
          transactions={serializedTransactions}
          accountOptions={accountOptions}
        />
      </div>
    </>
  );
};

export default TransactionsPage;

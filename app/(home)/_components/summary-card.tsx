import AddTransactionButton, {
  AccountOption,
} from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { formatCurrency } from "@/app/_utils/currency";
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import ManageAccountsButton from "@/app/_components/manage-accounts-button";
import { AccountSummary } from "@/app/_data/get-dashboard/types";

export interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  userCanAddTransaction?: boolean;
  previousAmount?: number;
  difference?: number;
  accountOptions?: AccountOption[];
  accountSummaries?: AccountSummary[];
}

const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  userCanAddTransaction,
  previousAmount,
  difference,
  accountOptions,
  accountSummaries,
}: SummaryCardProps) => {
  const hasHistoricalData = typeof previousAmount === "number";
  const differenceValue = typeof difference === "number" ? difference : 0;
  const differenceColor =
    differenceValue > 0
      ? "text-emerald-500"
      : differenceValue < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card className={`h-full min-w-0 ${size === "large" ? "bg-white/5" : ""}`}>
      <CardHeader className="flex-row items-center gap-4 space-y-0 p-4 sm:p-6">
        {icon}
        <p
          className={`${
            size === "small" ? "text-muted-foreground" : "text-white/70"
          }`}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4 pt-0 sm:flex-nowrap sm:p-6 sm:pt-0">
        <p
          className={`font-bold ${size === "small" ? "text-2xl" : "text-4xl"}`}
        >
          {formatCurrency(amount)}
        </p>

        {size === "large" && (
          <div className="flex flex-wrap gap-3">
            {accountSummaries && accountSummaries.length > 0 && (
              <ManageAccountsButton accounts={accountSummaries} />
            )}
            {accountOptions && accountOptions.length > 0 && (
              <AddTransactionButton
                userCanAddTransaction={userCanAddTransaction}
                accounts={accountOptions}
              />
            )}
          </div>
        )}
      </CardContent>

      {size === "large" && hasHistoricalData && (
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-start justify-between gap-6 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Saldo mês anterior</p>
              <p className="font-medium">
                {formatCurrency(previousAmount ?? 0)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-muted-foreground">Diferença</p>
              <div
                className={`flex items-center gap-2 font-semibold ${differenceColor}`}
              >
                {differenceValue > 0 && <ArrowUpRightIcon size={16} />}
                {differenceValue < 0 && <ArrowDownRightIcon size={16} />}
                {differenceValue === 0 && <MinusIcon size={16} />}
                <span>
                  {differenceValue > 0 ? "+" : differenceValue < 0 ? "-" : ""}
                  {formatCurrency(Math.abs(differenceValue))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SummaryCard;

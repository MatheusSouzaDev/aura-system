import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard, { SummaryCardProps } from "./summary-card";
import { AccountSummary } from "@/app/_data/get-dashboard/types";
import { formatCurrency } from "@/app/_utils/currency";
import { AccountOption } from "@/app/_components/add-transaction-button";

export interface SummaryCardsProps {
  balanceTotal: number;
  previousMonthBalance: number;
  balanceDifference: number;
  forecastBalance: number;
  forecastDifference: number;
  depositTotal: number;
  expensesTotal: number;
  investmentsTotal: number;
  userCanAddTransaction?: boolean;
  accounts: AccountSummary[];
}

type SummaryCardData = Pick<
  SummaryCardsProps,
  | "balanceTotal"
  | "previousMonthBalance"
  | "balanceDifference"
  | "depositTotal"
  | "expensesTotal"
  | "investmentsTotal"
>;

export interface SummaryCardConfig
  extends Pick<SummaryCardProps, "icon" | "title" | "size"> {
  key: string;
  amountField: keyof SummaryCardData;
  differenceField?: keyof SummaryCardData;
  previousAmountField?: keyof SummaryCardData;
}

export const SUMMARY_CARD_CONFIG: SummaryCardConfig[] = [
  {
    key: "balance",
    icon: <WalletIcon size={16} />,
    title: "Saldo",
    size: "large",
    amountField: "balanceTotal",
    previousAmountField: "previousMonthBalance",
    differenceField: "balanceDifference",
  },
  {
    key: "deposit",
    icon: <TrendingUpIcon size={16} className="text-primary" />,
    title: "Receita",
    amountField: "depositTotal",
  },
  {
    key: "expense",
    icon: <TrendingDownIcon size={16} className="text-red-500" />,
    title: "Despesas",
    amountField: "expensesTotal",
  },
  {
    key: "investment",
    icon: <PiggyBankIcon size={16} />,
    title: "Investido",
    amountField: "investmentsTotal",
  },
];

const SummaryCards = ({
  balanceTotal,
  previousMonthBalance,
  balanceDifference,
  forecastBalance,
  forecastDifference,
  depositTotal,
  expensesTotal,
  investmentsTotal,
  userCanAddTransaction,
  accounts,
}: SummaryCardsProps) => {
  const summaryCardData: SummaryCardData = {
    balanceTotal,
    previousMonthBalance,
    balanceDifference,
    depositTotal,
    expensesTotal,
    investmentsTotal,
  };

  const [primaryCard, ...secondaryCards] = SUMMARY_CARD_CONFIG;

  const renderCard = (
    config: SummaryCardConfig,
    accountOptionsForCard: AccountOption[],
    accountSummariesForCard: AccountSummary[],
    extra?: Partial<SummaryCardProps>,
  ) => {
    const {
      key,
      amountField,
      differenceField,
      previousAmountField,
      size,
      ...rest
    } = config;

    return (
      <SummaryCard
        key={key}
        amount={summaryCardData[amountField]}
        difference={
          differenceField ? summaryCardData[differenceField] : undefined
        }
        previousAmount={
          previousAmountField ? summaryCardData[previousAmountField] : undefined
        }
        size={size}
        userCanAddTransaction={
          size === "large" ? userCanAddTransaction : undefined
        }
        accountOptions={size === "large" ? accountOptionsForCard : undefined}
        accountSummaries={
          size === "large" ? accountSummariesForCard : undefined
        }
        {...extra}
        {...rest}
      />
    );
  };

  if (!primaryCard) {
    return null;
  }

  const accountOptions: AccountOption[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
  }));

  const overviewAccounts =
    accounts.filter((account) => account.includeInOverview) ?? [];
  const accountCardsToShow =
    overviewAccounts.length > 0 ? overviewAccounts : accounts;

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {renderCard(primaryCard, accountOptions, accounts, {
        forecastAmount: forecastBalance,
        forecastDifference,
      })}
      {!!accountCardsToShow.length && (
        <AccountBalances accounts={accountCardsToShow} />
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {secondaryCards.map((cardConfig) =>
          renderCard(cardConfig, accountOptions, accounts),
        )}
      </div>
    </div>
  );
};

export default SummaryCards;

interface AccountBalancesProps {
  accounts: AccountSummary[];
}

const AccountBalances = ({ accounts }: AccountBalancesProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const balanceValue = account.balance ?? 0;

        return (
          <div
            key={account.id}
            className="rounded-xl border border-white/5 bg-white/[3%] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Conta</p>
                <p className="text-lg font-semibold">{account.name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${account.includeInOverview ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-white/70"}`}
              >
                {account.includeInOverview ? "No dashboard" : "Oculta"}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">
              {formatCurrency(balanceValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {account.includeInBalance
                ? "Incluida no saldo mensal"
                : "Fora do saldo mensal"}
            </p>
          </div>
        );
      })}
    </div>
  );
};

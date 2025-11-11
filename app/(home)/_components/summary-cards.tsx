import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard, { SummaryCardProps } from "./summary-card";

export interface SummaryCardsProps {
  balanceTotal: number;
  previousMonthBalance: number;
  balanceDifference: number;
  depositTotal: number;
  expensesTotal: number;
  investmentsTotal: number;
  userCanAddTransaction?: boolean;
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
  depositTotal,
  expensesTotal,
  investmentsTotal,
  userCanAddTransaction,
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

  const renderCard = ({
    key,
    amountField,
    differenceField,
    previousAmountField,
    size,
    ...rest
  }: SummaryCardConfig) => (
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
      {...rest}
    />
  );

  if (!primaryCard) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {renderCard(primaryCard)}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {secondaryCards.map((cardConfig) => renderCard(cardConfig))}
      </div>
    </div>
  );
};

export default SummaryCards;

import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard from "./summary-card";

interface summaryCardsProps {
  balanceTotal: number;
  previousMonthBalance: number;
  balanceDifference: number;
  depositTotal: number;
  expensesTotal: number;
  investmentsTotal: number;
  userCanAddTransaction?: boolean;
}

const SummaryCards = ({
  balanceTotal,
  previousMonthBalance,
  balanceDifference,
  depositTotal,
  expensesTotal,
  investmentsTotal,
  userCanAddTransaction,
}: summaryCardsProps) => {
  return (
    <div className="space-y-6">
      <SummaryCard
        icon={<WalletIcon size={16} />}
        title="Saldo"
        amount={balanceTotal}
        size="large"
        previousAmount={previousMonthBalance}
        difference={balanceDifference}
        userCanAddTransaction={userCanAddTransaction}
      />
      <div className="grid grid-cols-3 gap-6">
        <SummaryCard
          icon={<TrendingUpIcon size={16} className="text-primary" />}
          title="Receita"
          amount={depositTotal}
        />
        <SummaryCard
          icon={<TrendingDownIcon size={16} className="text-red-500" />}
          title="Despesas"
          amount={expensesTotal}
        />
        <SummaryCard
          icon={<PiggyBankIcon size={16} />}
          title="Investido"
          amount={investmentsTotal}
        />
      </div>
    </div>
  );
};

export default SummaryCards;

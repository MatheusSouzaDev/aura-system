"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { TransactionType } from "@prisma/client";
import { TransactionPercentagePerType } from "@/app/_data/get-dashboard/types";
import { PiggyBank, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import PercentageItem from "./percentage-item";

const chartConfig = {
  [TransactionType.INVESTMENT]: {
    label: "Investido",
    color: "#FFFFFF",
  },
  [TransactionType.DEPOSIT]: {
    label: "Receita",
    color: "#55B02E",
  },
  [TransactionType.EXPENSE]: {
    label: "Despesa",
    color: "#E93030",
  },
} satisfies ChartConfig;

interface transactionsPieChartProps {
  typesPercentage: TransactionPercentagePerType;
  depositTotal: number;
  expensesTotal: number;
  investmentsTotal: number;
}

const TransactionsPieChart = ({
  depositTotal,
  expensesTotal,
  investmentsTotal,
  typesPercentage,
}: transactionsPieChartProps) => {
  const chartData = [
    {
      type: TransactionType.DEPOSIT,
      amount: depositTotal,
      fill: chartConfig[TransactionType.DEPOSIT].color,
      label: chartConfig[TransactionType.DEPOSIT].label,
    },
    {
      type: TransactionType.EXPENSE,
      amount: expensesTotal,
      fill: chartConfig[TransactionType.EXPENSE].color,
      label: chartConfig[TransactionType.EXPENSE].label,
    },
    {
      type: TransactionType.INVESTMENT,
      amount: investmentsTotal,
      fill: chartConfig[TransactionType.INVESTMENT].color,
      label: chartConfig[TransactionType.INVESTMENT].label,
    },
  ];

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-md h-[260px] sm:h-[320px] xl:h-[360px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="type"
              innerRadius="65%"
              outerRadius="80%"
            />
          </PieChart>
        </ChartContainer>
        <div className="space-y-2">
          <PercentageItem
            icon={<TrendingUpIcon size={16} className="text-primary" />}
            title="Receitas"
            value={typesPercentage[TransactionType.DEPOSIT]}
          />
          <PercentageItem
            icon={<TrendingDownIcon size={16} className="text-red-500" />}
            title="Despesas"
            value={typesPercentage[TransactionType.EXPENSE]}
          />
          <PercentageItem
            icon={<PiggyBank size={16} />}
            title="Investimentos"
            value={typesPercentage[TransactionType.INVESTMENT]}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsPieChart;

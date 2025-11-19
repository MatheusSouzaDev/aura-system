"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { TransactionPercentagePerType } from "@/app/_data/get-dashboard/types";
import { PiggyBank, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import PercentageItem from "./percentage-item";

const chartConfig = {
  investment: {
    label: "Investido",
    color: "#FFFFFF",
  },
  deposit: {
    label: "Receita",
    color: "#55B02E",
  },
  expense: {
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
      type: "deposit",
      amount: depositTotal,
      fill: chartConfig.deposit.color,
      label: chartConfig.deposit.label,
    },
    {
      type: "expense",
      amount: expensesTotal,
      fill: chartConfig.expense.color,
      label: chartConfig.expense.label,
    },
    {
      type: "investment",
      amount: investmentsTotal,
      fill: chartConfig.investment.color,
      label: chartConfig.investment.label,
    },
  ];

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-auto h-[clamp(220px,28vh,320px)] w-full min-w-0 max-w-full overflow-hidden rounded-md lg:h-[clamp(240px,24vh,300px)]"
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
            value={typesPercentage.deposit}
          />
          <PercentageItem
            icon={<TrendingDownIcon size={16} className="text-red-500" />}
            title="Despesas"
            value={typesPercentage.expense}
          />
          <PercentageItem
            icon={<PiggyBank size={16} />}
            title="Investimentos"
            value={typesPercentage.investment}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsPieChart;

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { MONTH_OPTIONS, getRecentYears } from "@/app/_constants/time";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface TimeSelectProps {
  month: string;
  year: string;
}

const TimeSelect = ({ month, year }: TimeSelectProps) => {
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const years = useMemo(() => getRecentYears(5), []);

  const updatePeriod = (nextMonth: string, nextYear: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    params.set("month", nextMonth);
    params.set("year", nextYear);

    push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        onValueChange={(value) => updatePeriod(value, year)}
        value={month}
      >
        <SelectTrigger className="w-[160px] rounded-full">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(value) => updatePeriod(month, value)}
        value={year}
      >
        <SelectTrigger className="w-[120px] rounded-full">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeSelect;

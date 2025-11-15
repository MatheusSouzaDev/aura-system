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
  className?: string;
}

const TimeSelect = ({ month, year, className }: TimeSelectProps) => {
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
    <div
      className={`flex w-full flex-nowrap items-center gap-2 ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1 sm:flex-none">
        <Select
          onValueChange={(value) => updatePeriod(value, year)}
          value={month}
        >
          <SelectTrigger className="w-full rounded-full sm:w-[160px]">
            <SelectValue placeholder="MÃªs" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 flex-1 sm:flex-none">
        <Select
          onValueChange={(value) => updatePeriod(month, value)}
          value={year}
        >
          <SelectTrigger className="w-full rounded-full sm:w-[120px]">
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
    </div>
  );
};

export default TimeSelect;

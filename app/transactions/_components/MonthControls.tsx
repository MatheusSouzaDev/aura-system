"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, subMonths, format } from "date-fns";
import TimeSelect from "@/app/(home)/_components/time-select"; // <-- seu componente existente
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useCallback } from "react";

type Props = {
  month?: string;
  year?: string;
  basePath?: string; // ex: '/transactions' ou '/'
  className?: string;
  onChange?: (m: string, y: string) => void;
};

export default function MonthControls({
  month,
  year,
  basePath = "/transactions",
  className = "",
  onChange,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const current = useMemo(() => new Date(y, m - 1, 1), [m, y]);

  const pushPeriod = useCallback(
    (nextMonth: number, nextYear: number, replace = false) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("month", String(nextMonth));
      params.set("year", String(nextYear));
      const url = `${basePath}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
      onChange?.(String(nextMonth), String(nextYear));
    },
    [basePath, onChange, router, searchParams],
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        aria-label="Mês anterior"
        onClick={() => {
          const prev = subMonths(current, 1);
          pushPeriod(prev.getMonth() + 1, prev.getFullYear());
        }}
        className="rounded-full bg-gray-900 p-2 text-white hover:bg-gray-800"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="rounded-full bg-black px-4 py-2 text-white">
        <div className="text-sm font-medium">
          {format(current, "MMMM yyyy")}
        </div>
      </div>

      <button
        aria-label="Próximo mês"
        onClick={() => {
          const next = addMonths(current, 1);
          pushPeriod(next.getMonth() + 1, next.getFullYear());
        }}
        className="rounded-full bg-gray-900 p-2 text-white hover:bg-gray-800"
      >
        <ChevronRight size={18} />
      </button>

      {/* Reaproveita o TimeSelect existente (dropdowns mês/ano) */}
      <div className="ml-2">
        <TimeSelect month={String(m)} year={String(y)} className="w-[220px]" />
      </div>
    </div>
  );
}

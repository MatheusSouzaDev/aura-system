"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useCallback } from "react";
import { ptBR } from "date-fns/locale";

type Props = {
  month?: string;
  year?: string;
  basePath?: string; // ex: '/transactions' ou '/'
  className?: string;
  onChange?: (m: string, y: string) => void;
};

export default function TimeSelect({
  month,
  year,
  basePath = "",
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

  const label = useMemo(() => {
    return format(current, "MMMM yyyy", { locale: ptBR }).replace(/^./, (c) =>
      c.toUpperCase(),
    );
  }, [current]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        aria-label="Mês anterior"
        onClick={() => {
          const prev = subMonths(current, 1);
          pushPeriod(prev.getMonth() + 1, prev.getFullYear());
        }}
        className="rounded-full border border-input bg-background p-2 text-white ring-offset-background hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-center text-white hover:bg-white/5">
        <div className="text-sm font-medium">{label}</div>
      </div>

      <button
        aria-label="Próximo mês"
        onClick={() => {
          const next = addMonths(current, 1);
          pushPeriod(next.getMonth() + 1, next.getFullYear());
        }}
        className="rounded-full border border-input bg-background p-2 text-white ring-offset-background hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

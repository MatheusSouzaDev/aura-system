"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { MONTH_OPTIONS, getRecentYears } from "@/app/_constants/time";
import { BotIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";
import { generateAiReport } from "../_actions/generate-ai-report";
import { toast } from "sonner";

interface AiReportButtonProps {
  hasAiReportAccess: boolean;
  month: string;
  year: string;
}

const AiReportButton = ({
  hasAiReportAccess,
  month,
  year,
}: AiReportButtonProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const yearOptions = useMemo(() => getRecentYears(5), []);

  useEffect(() => {
    setSelectedMonth(month);
  }, [month]);

  useEffect(() => {
    setSelectedYear(year);
  }, [year]);

  const handleGenerateReportClick = async () => {
    try {
      setReportIsLoading(true);
      const aiReport = await generateAiReport({
        month: selectedMonth,
        year: selectedYear,
      });

      if (!aiReport) {
        toast.info(
          "Não encontramos transações para gerar o relatório neste período.",
        );
        setReport(null);
        return;
      }

      setReport(aiReport);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o relatório no momento.");
    } finally {
      setReportIsLoading(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setReport(null);
          setSelectedMonth(month);
          setSelectedYear(year);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          Relatório IA
          <BotIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        {hasAiReportAccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Relatório de IA</DialogTitle>
              <DialogDescription>
                Use inteligência artificial para gerar um relatório com insights
                sobre suas finanças.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-3">
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                disabled={reportIsLoading}
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
                value={selectedYear}
                onValueChange={setSelectedYear}
                disabled={reportIsLoading}
              >
                <SelectTrigger className="w-[120px] rounded-full">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="prose max-h-[450px] text-white prose-h3:text-white prose-h4:text-white prose-strong:text-white">
              <Markdown>
                {report ??
                  'Selecione um período e clique em "Gerar relatório" para visualizar os insights.'}
              </Markdown>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleGenerateReportClick}
                disabled={reportIsLoading}
              >
                {reportIsLoading && <Loader2Icon className="animate-spin" />}
                Gerar relatório
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Relatório de IA</DialogTitle>
              <DialogDescription>
                Você precisa de um plano habilitado para IA para gerar
                relatórios com IA
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button asChild>
                <Link href="/subscription">Conhecer planos</Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;

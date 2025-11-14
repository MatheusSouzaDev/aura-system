"use server";

import { getDashboardContext } from "@/app/_data/dashboard-context";
import { db } from "@/app/_lib/prisma";
import { getActiveSubscriptionPlan } from "@/app/_constants/subscription-plans";
import { MONTH_OPTIONS } from "@/app/_constants/time";
import { clerkClient } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { GenerateAiReportSchema, generateAiReportSchema } from "./schema";

export const generateAiReport = async ({
  month,
  year,
}: GenerateAiReportSchema): Promise<string | null> => {
  generateAiReportSchema.parse({ month, year });

  const { currentPeriod, userId } = await getDashboardContext({ month, year });

  const user = await clerkClient.users.getUser(userId);
  const activePlan = getActiveSubscriptionPlan(
    (user.publicMetadata.subscriptionPlan as string | undefined) ?? undefined,
  );

  if (!activePlan || !activePlan.capabilities.aiReports) {
    throw new Error("You need a plus plan to generate AI report");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: currentPeriod.start,
        lte: currentPeriod.end,
      },
    },
    orderBy: { date: "asc" },
  });

  if (!transactions.length) {
    return null;
  }

  const selectedMonthLabel =
    MONTH_OPTIONS.find((option) => option.value === String(Number(month)))
      ?.label ?? month;

  const formattedTransactions = transactions
    .map((transaction) => {
      const formattedDate = transaction.date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      return `${formattedDate}-${transaction.type}-R$${transaction.amount}-${transaction.category}`;
    })
    .join("; ");

  const content = `Gere um relatório com insights sobre as minhas finanças referentes a ${selectedMonthLabel}/${year}. Considere pontos fortes, oportunidades e recomendações claras para otimizar meu orçamento. As transações estão divididas por ponto e vírgula. A estrutura de cada uma é {DATA}-{TIPO}-{VALOR}-{CATEGORIA}. São elas: ${formattedTransactions}`;

  const openAi = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openAi.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em gestão e organização de finanças pessoais. Você ajuda as pessoas a organizarem melhor as suas finanças.",
      },
      {
        role: "user",
        content,
      },
    ],
  });

  return completion.choices[0].message.content ?? null;
};

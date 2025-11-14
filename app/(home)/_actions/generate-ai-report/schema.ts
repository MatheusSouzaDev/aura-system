import { isMatch } from "date-fns";
import { z } from "zod";

export const generateAiReportSchema = z.object({
  month: z.string().refine((value) => isMatch(value.padStart(2, "0"), "MM"), {
    message: "Mês inválido",
  }),
  year: z.string().refine((value) => isMatch(value, "yyyy"), {
    message: "Ano inválido",
  }),
});

export type GenerateAiReportSchema = z.infer<typeof generateAiReportSchema>;

import { z } from "zod";

export const accountSettingsSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "O nome é obrigatório"),
  color: z
    .string()
    .trim()
    .regex(/^#?[0-9a-fA-F]{3,8}$/, "Forneça uma cor hexadecimal válida")
    .optional()
    .nullable()
    .transform((value) =>
      value ? (value.startsWith("#") ? value : `#${value}`) : null,
    ),
  includeInBalance: z.boolean().optional(),
  includeInCashFlow: z.boolean().optional(),
  includeInInvestments: z.boolean().optional(),
  includeInAiReports: z.boolean().optional(),
  includeInOverview: z.boolean().optional(),
});

export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;

export const deleteAccountSchema = z.object({
  id: z.string().min(1),
});

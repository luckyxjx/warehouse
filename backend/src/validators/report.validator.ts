import { z } from "zod";

export const monthlyReportSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(1970).optional(),
    month: z.coerce.number().int().min(1).max(12).optional()
  })
});

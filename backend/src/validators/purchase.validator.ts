import { z } from "zod";

export const createPurchaseSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    supplierName: z.string().min(1).max(180).default("Default Supplier"),
    quantity: z.coerce.number().int().positive(),
    cost: z.coerce.number().nonnegative()
  })
});

import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().positive()
      })
    ).min(1)
  })
});

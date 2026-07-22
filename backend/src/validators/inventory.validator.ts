import { z } from "zod";

export const addStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive()
  })
});

export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().refine((value) => value !== 0, {
      message: "Quantity must not be zero"
    })
  })
});

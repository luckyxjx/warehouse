import { z } from "zod";

const moneySchema = z.coerce.number().nonnegative();

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(180),
    sku: z.string().min(1).max(80),
    category: z.string().min(1).max(120),
    purchasePrice: moneySchema,
    sellingPrice: moneySchema,
    stock: z.coerce.number().int().nonnegative().default(0),
    minStock: z.coerce.number().int().nonnegative().default(0)
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: createProductSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  })
});

export const productListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    category: z.string().trim().optional()
  })
});

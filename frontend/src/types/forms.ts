import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long")
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  purchasePrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative()
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const stockSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().int().refine((value) => value !== 0, "Quantity cannot be zero")
});

export type StockFormValues = z.infer<typeof stockSchema>;

export const purchaseSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  supplierName: z.string().min(1, "Supplier is required"),
  quantity: z.coerce.number().int().positive(),
  cost: z.coerce.number().nonnegative()
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;

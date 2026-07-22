import { z } from "zod";

export const quoteSchema = z.object({
  body: z.object({
    originPincode: z.string().regex(/^\d{6}$/, "Origin pincode must be 6 digits"),
    destinationPincode: z.string().regex(/^\d{6}$/, "Destination pincode must be 6 digits"),
    actualWeightKg: z.coerce.number().positive(),
    lengthCm: z.coerce.number().positive(),
    widthCm: z.coerce.number().positive(),
    heightCm: z.coerce.number().positive()
  })
});

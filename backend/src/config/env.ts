import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Treat empty strings as undefined so Vercel's empty env var injections don't fail Zod validation
const emptyToUndefined = z.string().transform((v) => (v.trim() === "" ? undefined : v));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  FRONTEND_URL: emptyToUndefined
    .pipe(z.string().url().optional())
    .transform((v) => v ?? "http://localhost:3001"),
  CORS_ORIGINS: z.string().optional(),
});

// Debug: log which env vars are present (values redacted) to help diagnose Vercel issues
if (process.env.NODE_ENV === "production") {
  const keys = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL", "CORS_ORIGINS"];
  console.log("[env] Loaded vars:", keys.map((k) => `${k}=${process.env[k] ? "✓" : "✗ MISSING"}`).join(", "));
}

export const env = envSchema.parse(process.env);

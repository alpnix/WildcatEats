import { z } from "zod";

const optionalNonEmpty = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("placeholder-service-role-key"),
  STRIPE_SECRET_KEY: optionalNonEmpty,
  STRIPE_WEBHOOK_SECRET: optionalNonEmpty,
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_CRON_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional()
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-anon-key"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional()
});

export const env = serverSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  APP_URL: process.env.APP_URL,
  APP_CRON_SECRET: process.env.APP_CRON_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY
});

export const publicEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
});

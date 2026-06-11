import { z } from "zod";

export const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().startsWith("redis://"),
    CLERK_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_PSI_API_KEY: z.string().optional(),
    HIGH_OPPORTUNITY_THRESHOLD: z.coerce.number().int().default(60),
    SCRAPER_MAX_RESULTS: z.coerce.number().int().default(120),
    SCRAPER_CONCURRENCY: z.coerce.number().int().default(2),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: "custom",
        message: "OPENAI_API_KEY is required in production mode",
        path: ["OPENAI_API_KEY"],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
  source: Record<string, string | undefined> = process.env,
) {
  return envSchema.safeParse(source);
}

export function requireEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`,
    );
  }
  return result.data;
}

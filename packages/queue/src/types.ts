import { z } from "zod";

export const QUEUE_NAMES = {
  search: "search",
  analyze: "analyze",
  artifacts: "artifacts",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const searchJobPayloadSchema = z.object({
  searchJobId: z.string().min(1),
  userId: z.string().min(1),
  segmentId: z.string().min(1),
  subcategoryId: z.string().optional(),
  state: z.string().min(2).max(2),
  city: z.string().min(1),
  radiusKm: z.number().int().min(1).max(50),
  filters: z
    .object({
      hasWebsite: z.boolean().optional(),
      noWebsite: z.boolean().optional(),
      minRating: z.number().optional(),
      hasWhatsapp: z.boolean().optional(),
      hasInstagram: z.boolean().optional(),
    })
    .optional(),
});

export type SearchJobPayload = z.infer<typeof searchJobPayloadSchema>;

export const analyzeJobPayloadSchema = z.object({
  leadId: z.string().min(1),
  userId: z.string().min(1),
  searchJobId: z.string().min(1),
});

export type AnalyzeJobPayload = z.infer<typeof analyzeJobPayloadSchema>;

export const artifactsJobPayloadSchema = z.object({
  leadId: z.string().min(1),
  userId: z.string().min(1),
});

export type ArtifactsJobPayload = z.infer<typeof artifactsJobPayloadSchema>;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
};

export const SCRAPER_CONCURRENCY = 2;

export const JOB_NAMES = {
  search: "search.run",
  analyze: "analyze.run",
  artifacts: "artifacts.generate",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

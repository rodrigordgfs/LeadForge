import { z } from "zod";

export const SSE_EVENT_TYPES = [
  "progress",
  "lead_scraped",
  "lead_analyzed",
  "artifact_ready",
  "job_completed",
  "job_failed",
] as const;

export type SseEventType = (typeof SSE_EVENT_TYPES)[number];

const progressPayloadSchema = z.object({
  progressPct: z.number().int().min(0).max(100),
  totalFound: z.number().int().nonnegative().optional(),
});

const leadScrapedPayloadSchema = z.object({
  leadId: z.string().min(1),
  name: z.string().min(1),
});

const leadAnalyzedPayloadSchema = z.object({
  leadId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  scoreBand: z.enum(["critical", "low", "medium", "excellent"]),
  hasRealWebsite: z.boolean(),
  autoPipelineTriggered: z.boolean(),
});

const artifactReadyPayloadSchema = z.object({
  leadId: z.string().min(1),
  artifactType: z.string().min(1),
});

const jobCompletedPayloadSchema = z.object({
  searchJobId: z.string().min(1),
  totalFound: z.number().int().nonnegative(),
});

const jobFailedPayloadSchema = z.object({
  searchJobId: z.string().min(1),
  errorMessage: z.string().min(1),
});

export const sseEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("progress"), payload: progressPayloadSchema }),
  z.object({
    type: z.literal("lead_scraped"),
    payload: leadScrapedPayloadSchema,
  }),
  z.object({
    type: z.literal("lead_analyzed"),
    payload: leadAnalyzedPayloadSchema,
  }),
  z.object({
    type: z.literal("artifact_ready"),
    payload: artifactReadyPayloadSchema,
  }),
  z.object({
    type: z.literal("job_completed"),
    payload: jobCompletedPayloadSchema,
  }),
  z.object({
    type: z.literal("job_failed"),
    payload: jobFailedPayloadSchema,
  }),
]);

export type SseEvent = z.infer<typeof sseEventSchema>;

export const sseChannelName = (searchJobId: string) =>
  `leadforge:search:${searchJobId}:events`;

export function isTerminalSseEvent(type: SseEventType): boolean {
  return type === "job_completed" || type === "job_failed";
}

export function serializeSseEvent(event: SseEvent): string {
  return JSON.stringify(sseEventSchema.parse(event));
}

export function formatSseMessage(event: SseEvent): string {
  return `event: ${event.type}\ndata: ${serializeSseEvent(event)}\n\n`;
}

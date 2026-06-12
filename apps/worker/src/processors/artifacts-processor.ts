import { prisma } from "@leadforge/db";
import type { ArtifactsJobPayload } from "@leadforge/queue";
import { publishSseEvent } from "@leadforge/shared/publisher";
import type { Job } from "bullmq";
import { storeAllArtifacts } from "../artifacts/artifact-storage.js";
import { TextArtifactGenerator } from "../artifacts/text-generator.js";

export const ARTIFACTS_JOB_TIMEOUT_MS = 5 * 60 * 1000;

export interface ArtifactsProcessorDeps {
  textGenerator?: TextArtifactGenerator;
  storeArtifacts?: typeof storeAllArtifacts;
  publishEvent?: typeof publishSseEvent;
}

async function publishJobFailed(
  searchJobId: string,
  errorMessage: string,
  publishEvent: typeof publishSseEvent,
): Promise<void> {
  await publishEvent(searchJobId, {
    type: "job_failed",
    payload: { searchJobId, errorMessage },
  });
}

export async function processArtifactsJob(
  payload: ArtifactsJobPayload,
  deps: ArtifactsProcessorDeps = {},
): Promise<void> {
  const publishEvent = deps.publishEvent ?? publishSseEvent;
  const textGenerator = deps.textGenerator ?? new TextArtifactGenerator();
  const storeArtifacts = deps.storeArtifacts ?? storeAllArtifacts;
  const { leadId } = payload;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const searchJobId = lead.searchJobId;

  try {
    const generated = await textGenerator.generateAll(lead);
    const stored = await storeArtifacts(leadId, lead.name, generated);

    for (const { type } of stored) {
      await publishEvent(searchJobId, {
        type: "artifact_ready",
        payload: {
          leadId,
          artifactType: type,
        },
      });
    }

    await publishEvent(searchJobId, {
      type: "job_completed",
      payload: {
        searchJobId,
        totalFound: stored.length,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown artifacts processor error";

    await publishJobFailed(searchJobId, errorMessage, publishEvent);
    throw error;
  }
}

export function createArtifactsProcessorHandler(deps: ArtifactsProcessorDeps = {}) {
  return async (job: Job<ArtifactsJobPayload>) => {
    await processArtifactsJob(job.data, deps);
  };
}

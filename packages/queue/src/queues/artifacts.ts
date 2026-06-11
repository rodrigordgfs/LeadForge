import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "../connection.js";
import {
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  type ArtifactsJobPayload,
} from "../types.js";

let artifactsQueue: Queue<ArtifactsJobPayload> | undefined;

export function getArtifactsQueue(): Queue<ArtifactsJobPayload> {
  if (!artifactsQueue) {
    artifactsQueue = new Queue<ArtifactsJobPayload>(QUEUE_NAMES.artifacts, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return artifactsQueue;
}

export async function enqueueArtifactsJob(
  payload: ArtifactsJobPayload,
  jobId?: string,
): Promise<string> {
  const job = await getArtifactsQueue().add(JOB_NAMES.artifacts, payload, {
    jobId,
  });
  return job.id ?? jobId ?? "";
}

export async function closeArtifactsQueue(): Promise<void> {
  await artifactsQueue?.close();
  artifactsQueue = undefined;
}

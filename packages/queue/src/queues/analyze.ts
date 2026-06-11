import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "../connection.js";
import {
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  type AnalyzeJobPayload,
} from "../types.js";

let analyzeQueue: Queue<AnalyzeJobPayload> | undefined;

export function getAnalyzeQueue(): Queue<AnalyzeJobPayload> {
  if (!analyzeQueue) {
    analyzeQueue = new Queue<AnalyzeJobPayload>(QUEUE_NAMES.analyze, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return analyzeQueue;
}

export async function enqueueAnalyzeJob(
  payload: AnalyzeJobPayload,
  jobId?: string,
): Promise<string> {
  const job = await getAnalyzeQueue().add(JOB_NAMES.analyze, payload, {
    jobId,
  });
  return job.id ?? jobId ?? "";
}

export async function closeAnalyzeQueue(): Promise<void> {
  await analyzeQueue?.close();
  analyzeQueue = undefined;
}

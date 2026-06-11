import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "../connection.js";
import {
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  type SearchJobPayload,
} from "../types.js";

let searchQueue: Queue<SearchJobPayload> | undefined;

export function getSearchQueue(): Queue<SearchJobPayload> {
  if (!searchQueue) {
    searchQueue = new Queue<SearchJobPayload>(QUEUE_NAMES.search, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return searchQueue;
}

export async function enqueueSearchJob(
  payload: SearchJobPayload,
  jobId?: string,
): Promise<string> {
  const job = await getSearchQueue().add(JOB_NAMES.search, payload, {
    jobId,
  });
  return job.id ?? jobId ?? "";
}

export async function closeSearchQueue(): Promise<void> {
  await searchQueue?.close();
  searchQueue = undefined;
}

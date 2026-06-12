import { createRedisClient } from "@leadforge/shared/redis";
import type { Job } from "bullmq";
import { getAnalyzeQueue } from "./queues/analyze.js";
import { getSearchQueue } from "./queues/search.js";

const CANCEL_KEY_PREFIX = "leadforge:search-cancel:";
const CANCEL_TTL_SECONDS = 86_400;

let cancellationRedis: ReturnType<typeof createRedisClient> | undefined;

function getCancellationRedis(): ReturnType<typeof createRedisClient> {
  if (!cancellationRedis) {
    cancellationRedis = createRedisClient();
  }
  return cancellationRedis;
}

function cancelKey(searchJobId: string): string {
  return `${CANCEL_KEY_PREFIX}${searchJobId}`;
}

export async function markSearchJobCancelled(
  searchJobId: string,
): Promise<void> {
  await getCancellationRedis().set(
    cancelKey(searchJobId),
    "1",
    "EX",
    CANCEL_TTL_SECONDS,
  );
}

export async function isSearchJobCancelled(
  searchJobId: string,
): Promise<boolean> {
  const value = await getCancellationRedis().get(cancelKey(searchJobId));
  return value === "1";
}

export async function clearSearchJobCancellation(
  searchJobId: string,
): Promise<void> {
  await getCancellationRedis().del(cancelKey(searchJobId));
}

async function removeQueueJob(job: Job): Promise<void> {
  const state = await job.getState();

  if (state === "active") {
    try {
      await job.discard();
    } catch {
      // Job may already be finishing.
    }
  }

  try {
    await job.remove();
  } catch {
    // Active jobs can remain locked until the worker releases them.
  }
}

export async function cancelSearchQueueJob(searchJobId: string): Promise<void> {
  const queue = getSearchQueue();
  const job = await queue.getJob(searchJobId);

  if (!job) {
    return;
  }

  await removeQueueJob(job);
}

export async function cancelAnalyzeJobsForSearch(
  searchJobId: string,
): Promise<void> {
  const queue = getAnalyzeQueue();
  const jobs = await queue.getJobs(["active", "waiting", "delayed"], 0, 1000);

  await Promise.all(
    jobs
      .filter((job) => job.data.searchJobId === searchJobId)
      .map((job) => removeQueueJob(job)),
  );
}

import { prisma, SearchJobStatus } from "@leadforge/db";
import { enqueueSearchJob, getSearchQueue } from "@leadforge/queue";
import type { SearchJobPayload } from "@leadforge/queue";

import { getSearchJobForUser } from "./get-search-job";

export interface RetrySearchJobResult {
  ok: true;
  searchJobId: string;
}

export interface RetrySearchJobError {
  ok: false;
  status: 404 | 409;
  message: string;
}

function toSearchPayload(job: {
  id: string;
  userId: string;
  segmentId: string;
  subcategoryId: string | null;
  state: string;
  city: string;
  radiusKm: number;
  filtersJson: unknown;
}): SearchJobPayload {
  const filters =
    job.filtersJson &&
    typeof job.filtersJson === "object" &&
    !Array.isArray(job.filtersJson)
      ? (job.filtersJson as SearchJobPayload["filters"])
      : undefined;

  return {
    searchJobId: job.id,
    userId: job.userId,
    segmentId: job.segmentId,
    subcategoryId: job.subcategoryId ?? undefined,
    state: job.state,
    city: job.city,
    radiusKm: job.radiusKm,
    filters,
  };
}

export async function retrySearchJob(
  userId: string,
  searchJobId: string,
): Promise<RetrySearchJobResult | RetrySearchJobError> {
  const job = await getSearchJobForUser(userId, searchJobId);

  if (!job) {
    return { ok: false, status: 404, message: "Search job not found" };
  }

  if (job.status === SearchJobStatus.running || job.status === SearchJobStatus.pending) {
    return {
      ok: false,
      status: 409,
      message: "A busca já está em andamento",
    };
  }

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status: SearchJobStatus.pending,
      progressPct: 0,
      totalFound: 0,
      errorMessage: null,
      completedAt: null,
    },
  });

  const queue = getSearchQueue();
  const existing = await queue.getJob(searchJobId);
  if (existing) {
    await existing.remove();
  }

  const dbJob = await prisma.searchJob.findUniqueOrThrow({
    where: { id: searchJobId },
  });

  await enqueueSearchJob(toSearchPayload(dbJob), searchJobId);

  return { ok: true, searchJobId };
}

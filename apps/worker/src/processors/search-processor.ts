import { prisma, SearchJobStatus } from "@leadforge/db";
import {
  enqueueAnalyzeJob,
  type SearchJobPayload,
} from "@leadforge/queue";
import {
  type MapsScraper,
  type ScrapedBusiness,
  type ScrapeSearchInput,
} from "@leadforge/shared";
import { publishSseEvent } from "@leadforge/shared/publisher";
import type { Job } from "bullmq";
import { CaptchaDetectedError } from "../scraper/errors.js";
import { upsertLeadFromScraped } from "../services/lead-upsert.js";

const MAX_SCRAPER_RETRIES = 3;

export interface SearchProcessorDeps {
  scraper: MapsScraper;
  publishEvent?: typeof publishSseEvent;
  enqueueAnalyze?: typeof enqueueAnalyzeJob;
}

function toScrapeInput(payload: SearchJobPayload): ScrapeSearchInput {
  return {
    segmentId: payload.segmentId,
    subcategoryId: payload.subcategoryId,
    state: payload.state,
    city: payload.city,
    radiusKm: payload.radiusKm,
    filters: payload.filters,
  };
}

function isTransientScraperError(error: unknown): boolean {
  if (error instanceof CaptchaDetectedError) {
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("target closed")
    );
  }

  return false;
}

export async function scrapeWithRetry(
  scraper: MapsScraper,
  input: ScrapeSearchInput,
  maxRetries = MAX_SCRAPER_RETRIES,
): Promise<ScrapedBusiness[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await scraper.scrape(input);
    } catch (error) {
      lastError = error;

      if (error instanceof CaptchaDetectedError) {
        throw error;
      }

      if (!isTransientScraperError(error) || attempt === maxRetries) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function markSearchJobFailed(
  searchJobId: string,
  errorMessage: string,
  publishEvent: typeof publishSseEvent,
): Promise<void> {
  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status: SearchJobStatus.failed,
      errorMessage,
      completedAt: new Date(),
    },
  });

  await publishEvent(searchJobId, {
    type: "job_failed",
    payload: { searchJobId, errorMessage },
  });
}

export async function processSearchJob(
  payload: SearchJobPayload,
  deps: SearchProcessorDeps,
): Promise<void> {
  const publishEvent = deps.publishEvent ?? publishSseEvent;
  const enqueueAnalyze = deps.enqueueAnalyze ?? enqueueAnalyzeJob;
  const { searchJobId, userId } = payload;

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: { status: SearchJobStatus.running, progressPct: 0, totalFound: 0 },
  });

  await publishEvent(searchJobId, {
    type: "progress",
    payload: { progressPct: 0, totalFound: 0 },
  });

  let businesses: ScrapedBusiness[];

  try {
    businesses = await scrapeWithRetry(
      deps.scraper,
      toScrapeInput(payload),
      MAX_SCRAPER_RETRIES,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown search processor error";

    await markSearchJobFailed(searchJobId, message, publishEvent);
    return;
  }

  const totalExpected = businesses.length;

  if (totalExpected === 0) {
    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: {
        status: SearchJobStatus.completed,
        progressPct: 100,
        totalFound: 0,
        completedAt: new Date(),
      },
    });

    await publishEvent(searchJobId, {
      type: "progress",
      payload: { progressPct: 100, totalFound: 0 },
    });

    await publishEvent(searchJobId, {
      type: "job_completed",
      payload: { searchJobId, totalFound: 0 },
    });
    return;
  }

  let scrapedCount = 0;

  for (const business of businesses) {
    const lead = await upsertLeadFromScraped(business, searchJobId, userId);
    await enqueueAnalyze({ leadId: lead.id, userId, searchJobId });

    await publishEvent(searchJobId, {
      type: "lead_scraped",
      payload: { leadId: lead.id, name: lead.name },
    });

    scrapedCount += 1;
    const progressPct =
      totalExpected > 0
        ? Math.round((scrapedCount / totalExpected) * 100)
        : 100;

    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: { progressPct, totalFound: scrapedCount },
    });

    await publishEvent(searchJobId, {
      type: "progress",
      payload: { progressPct, totalFound: scrapedCount },
    });
  }

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: {
      status: SearchJobStatus.completed,
      progressPct: 100,
      totalFound: scrapedCount,
      completedAt: new Date(),
    },
  });

  await publishEvent(searchJobId, {
    type: "job_completed",
    payload: { searchJobId, totalFound: scrapedCount },
  });
}

export function createSearchProcessorHandler(deps: SearchProcessorDeps) {
  return async (job: Job<SearchJobPayload>) => {
    await processSearchJob(job.data, deps);
  };
}

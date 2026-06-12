import { prisma, SearchJobStatus } from "@leadforge/db";
import {
  enqueueAnalyzeJob,
  isSearchJobCancelled,
  type SearchJobPayload,
} from "@leadforge/queue";
import {
  type MapsScraper,
  type ScrapedBusiness,
  type ScrapeSearchInput,
} from "@leadforge/shared";
import { publishSseEvent } from "@leadforge/shared/publisher";
import type { Job } from "bullmq";
import {
  CaptchaDetectedError,
  SearchCancelledError,
} from "../scraper/errors.js";
import { upsertLeadFromScraped } from "../services/lead-upsert.js";

const MAX_SCRAPER_RETRIES = 3;
const SCRAPE_SCROLL_PROGRESS_MAX = 20;
const SCRAPE_PROGRESS_MAX = 25;

export interface ScrapeProgressHooks {
  onScrapeProgress: (found: number) => Promise<void>;
  onEnrichProgress: (enriched: number, total: number) => Promise<void>;
  shouldAbort?: () => boolean | Promise<boolean>;
}

export interface SearchProcessorDeps {
  scraper: MapsScraper;
  createScraper?: (hooks: ScrapeProgressHooks) => MapsScraper;
  publishEvent?: typeof publishSseEvent;
  enqueueAnalyze?: typeof enqueueAnalyzeJob;
}

function getScraperMaxResults(): number {
  return Number.parseInt(process.env.SCRAPER_MAX_RESULTS ?? "120", 10);
}

function mapsScrollProgressPct(found: number, maxResults: number): number {
  if (found <= 0) {
    return 5;
  }

  return Math.min(
    SCRAPE_SCROLL_PROGRESS_MAX,
    Math.max(6, Math.round((found / maxResults) * SCRAPE_SCROLL_PROGRESS_MAX)),
  );
}

function mapsEnrichProgressPct(enriched: number, total: number): number {
  if (total <= 0) {
    return SCRAPE_SCROLL_PROGRESS_MAX;
  }

  const enrichSpan = SCRAPE_PROGRESS_MAX - SCRAPE_SCROLL_PROGRESS_MAX;

  return Math.min(
    SCRAPE_PROGRESS_MAX,
    Math.round(
      SCRAPE_SCROLL_PROGRESS_MAX + (enriched / total) * enrichSpan,
    ),
  );
}

function saveLeadProgressPct(scrapedCount: number, totalExpected: number): number {
  if (totalExpected <= 0) {
    return 100;
  }

  return Math.round(
    SCRAPE_PROGRESS_MAX +
      (scrapedCount / totalExpected) * (100 - SCRAPE_PROGRESS_MAX),
  );
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

async function assertSearchNotCancelled(searchJobId: string): Promise<void> {
  if (await isSearchJobCancelled(searchJobId)) {
    throw new SearchCancelledError();
  }

  const exists = await prisma.searchJob.findUnique({
    where: { id: searchJobId },
    select: { id: true },
  });

  if (!exists) {
    throw new SearchCancelledError();
  }
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
  const maxResults = getScraperMaxResults();

  const publishMapsScrapeProgress = async (found: number) => {
    await assertSearchNotCancelled(searchJobId);
    const progressPct = mapsScrollProgressPct(found, maxResults);
    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: { progressPct, totalFound: found },
    });
    await publishEvent(searchJobId, {
      type: "progress",
      payload: { progressPct, totalFound: found },
    });
  };

  const publishMapsEnrichProgress = async (enriched: number, total: number) => {
    await assertSearchNotCancelled(searchJobId);
    const progressPct = mapsEnrichProgressPct(enriched, total);
    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: { progressPct, totalFound: total },
    });
    await publishEvent(searchJobId, {
      type: "progress",
      payload: { progressPct, totalFound: total },
    });
  };

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: { status: SearchJobStatus.running, progressPct: 0, totalFound: 0 },
  });

  await publishEvent(searchJobId, {
    type: "progress",
    payload: { progressPct: 0, totalFound: 0 },
  });

  let businesses: ScrapedBusiness[];

  const shouldAbort = () => isSearchJobCancelled(searchJobId);

  const scraper =
    deps.createScraper?.({
      onScrapeProgress: publishMapsScrapeProgress,
      onEnrichProgress: publishMapsEnrichProgress,
      shouldAbort,
    }) ?? deps.scraper;

  try {
    await assertSearchNotCancelled(searchJobId);
    console.log(`[search] scraping Google Maps job=${searchJobId}`);
    await publishMapsScrapeProgress(0);
    businesses = await scrapeWithRetry(
      scraper,
      toScrapeInput(payload),
      MAX_SCRAPER_RETRIES,
    );
    console.log(
      `[search] Maps scrape finished job=${searchJobId} found=${businesses.length}`,
    );
  } catch (error) {
    if (error instanceof SearchCancelledError) {
      console.log(`[search] cancelled job=${searchJobId}`);
      return;
    }

    const message =
      error instanceof Error ? error.message : "Unknown search processor error";

    await markSearchJobFailed(searchJobId, message, publishEvent);
    return;
  }

  await assertSearchNotCancelled(searchJobId);

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
    await assertSearchNotCancelled(searchJobId);
    const lead = await upsertLeadFromScraped(business, searchJobId, userId);
    await enqueueAnalyze({ leadId: lead.id, userId, searchJobId });

    await publishEvent(searchJobId, {
      type: "lead_scraped",
      payload: { leadId: lead.id, name: lead.name },
    });

    scrapedCount += 1;
    const progressPct = saveLeadProgressPct(scrapedCount, totalExpected);

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

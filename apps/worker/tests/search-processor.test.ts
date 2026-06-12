import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScrapedBusiness } from "@leadforge/shared";

const searchJobUpdateMock = vi.fn();
const publishSseEventMock = vi.fn();
const enqueueAnalyzeJobMock = vi.fn();
const isSearchJobCancelledMock = vi.fn();
const searchJobFindUniqueMock = vi.fn();
const leadFindFirstMock = vi.fn();
const leadCreateMock = vi.fn();

vi.mock("@leadforge/db", () => ({
  prisma: {
    searchJob: {
      update: (...args: unknown[]) => searchJobUpdateMock(...args),
      findUnique: (...args: unknown[]) => searchJobFindUniqueMock(...args),
    },
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirstMock(...args),
      create: (...args: unknown[]) => leadCreateMock(...args),
      update: vi.fn(),
    },
  },
  SearchJobStatus: {
    pending: "pending",
    running: "running",
    completed: "completed",
    failed: "failed",
  },
}));

vi.mock("@leadforge/shared", async () => {
  const actual = await vi.importActual<typeof import("@leadforge/shared")>(
    "@leadforge/shared",
  );
  return {
    ...actual,
    publishSseEvent: (...args: unknown[]) => publishSseEventMock(...args),
  };
});

vi.mock("@leadforge/queue", async () => {
  const actual = await vi.importActual<typeof import("@leadforge/queue")>(
    "@leadforge/queue",
  );
  return {
    ...actual,
    isSearchJobCancelled: (...args: unknown[]) =>
      isSearchJobCancelledMock(...args),
    enqueueAnalyzeJob: (...args: unknown[]) => enqueueAnalyzeJobMock(...args),
  };
});

import { CaptchaDetectedError, SearchCancelledError } from "../src/scraper/errors.js";
import {
  processSearchJob,
  scrapeWithRetry,
} from "../src/processors/search-processor.js";

const payload = {
  searchJobId: "job-1",
  userId: "user-1",
  segmentId: "alimentacao",
  state: "RS",
  city: "Pelotas",
  radiusKm: 10,
};

function buildBusinesses(count: number): ScrapedBusiness[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `Business ${index + 1}`,
    category: "Padaria",
    address: `Rua ${index + 1}`,
    city: "Pelotas",
    state: "RS",
    mapsUrl: `https://maps.google.com/?cid=${index + 1}`,
  }));
}

describe("search processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSearchJobCancelledMock.mockResolvedValue(false);
    searchJobFindUniqueMock.mockResolvedValue({ id: "job-1" });
    leadFindFirstMock.mockResolvedValue(null);
    leadCreateMock.mockImplementation(async ({ data }: { data: { name: string } }) => ({
      id: `lead-${data.name}`,
      name: data.name,
    }));
    publishSseEventMock.mockResolvedValue(1);
    enqueueAnalyzeJobMock.mockResolvedValue("analyze-job");
    searchJobUpdateMock.mockResolvedValue({});
  });

  it("updates SearchJob status to running on start", async () => {
    const scraper = { scrape: vi.fn().mockResolvedValue([]) };

    await processSearchJob(payload, {
      scraper,
      publishEvent: publishSseEventMock,
      enqueueAnalyze: enqueueAnalyzeJobMock,
    });

    expect(searchJobUpdateMock).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { status: "running", progressPct: 0, totalFound: 0 },
    });
  });

  it("calculates progressPct as scrapedCount / totalExpected * 100", async () => {
    const scraper = { scrape: vi.fn().mockResolvedValue(buildBusinesses(4)) };

    await processSearchJob(payload, {
      scraper,
      publishEvent: publishSseEventMock,
      enqueueAnalyze: enqueueAnalyzeJobMock,
    });

    const progressUpdates = searchJobUpdateMock.mock.calls
      .map((call) => call[0]?.data?.progressPct)
      .filter((value) => value !== undefined);

    expect(progressUpdates).toContain(44);
    expect(progressUpdates).toContain(63);
    expect(progressUpdates).toContain(81);
    expect(progressUpdates).toContain(100);
  });

  it("stops without marking failed when search is cancelled", async () => {
    const scraper = {
      scrape: vi.fn().mockRejectedValue(new SearchCancelledError()),
    };

    await processSearchJob(payload, {
      scraper,
      publishEvent: publishSseEventMock,
      enqueueAnalyze: enqueueAnalyzeJobMock,
    });

    expect(searchJobUpdateMock).not.toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "failed",
      }),
    });
    expect(publishSseEventMock).not.toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ type: "job_failed" }),
    );
  });

  it("sets SearchJob failed with errorMessage on CaptchaDetectedError", async () => {
    const scraper = {
      scrape: vi.fn().mockRejectedValue(new CaptchaDetectedError()),
    };

    await processSearchJob(payload, {
      scraper,
      publishEvent: publishSseEventMock,
      enqueueAnalyze: enqueueAnalyzeJobMock,
    });

    expect(searchJobUpdateMock).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "failed",
        errorMessage: "Google Maps CAPTCHA detected",
      }),
    });

    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "job_failed",
      payload: {
        searchJobId: "job-1",
        errorMessage: "Google Maps CAPTCHA detected",
      },
    });
  });

  it("creates 5 leads and 5 analyze jobs with mocked scraper", async () => {
    const scraper = { scrape: vi.fn().mockResolvedValue(buildBusinesses(5)) };

    await processSearchJob(payload, {
      scraper,
      publishEvent: publishSseEventMock,
      enqueueAnalyze: enqueueAnalyzeJobMock,
    });

    expect(leadCreateMock).toHaveBeenCalledTimes(5);
    expect(enqueueAnalyzeJobMock).toHaveBeenCalledTimes(5);
    expect(publishSseEventMock).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ type: "lead_scraped" }),
    );

    expect(searchJobUpdateMock).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "completed",
        totalFound: 5,
        progressPct: 100,
      }),
    });

    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "job_completed",
      payload: { searchJobId: "job-1", totalFound: 5 },
    });
  });

  it("publishes lead_scraped for each persisted lead", async () => {
    const scraper = { scrape: vi.fn().mockResolvedValue(buildBusinesses(3)) };

    await processSearchJob(payload, {
      scraper,
      publishEvent: publishSseEventMock,
      enqueueAnalyze: enqueueAnalyzeJobMock,
    });

    const leadScrapedEvents = publishSseEventMock.mock.calls.filter(
      ([, event]) => event.type === "lead_scraped",
    );

    expect(leadScrapedEvents).toHaveLength(3);
  });
});

describe("scrapeWithRetry", () => {
  it("retries transient errors up to 3 times", async () => {
    const scraper = {
      scrape: vi
        .fn()
        .mockRejectedValueOnce(new Error("network timeout"))
        .mockResolvedValue([]),
    };

    await scrapeWithRetry(scraper, {
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(scraper.scrape).toHaveBeenCalledTimes(2);
  });

  it("does not retry CaptchaDetectedError", async () => {
    const scraper = {
      scrape: vi.fn().mockRejectedValue(new CaptchaDetectedError()),
    };

    await expect(
      scrapeWithRetry(scraper, {
        segmentId: "saude",
        state: "RS",
        city: "Pelotas",
        radiusKm: 10,
      }),
    ).rejects.toBeInstanceOf(CaptchaDetectedError);

    expect(scraper.scrape).toHaveBeenCalledTimes(1);
  });
});

import { readFile } from "node:fs/promises";
import { buildSearchQuery } from "@leadforge/shared";
import type {
  MapsScraper,
  ScrapeSearchInput,
  ScrapedBusiness,
} from "@leadforge/shared";
import type { Page } from "playwright";
import {
  extractCard,
  readDetailPhone,
  readDetailWebsite,
} from "./card-extract.js";
import { BrowserPool } from "./browser-pool.js";
import { CaptchaDetectedError, SearchCancelledError } from "./errors.js";
import { applyPostFilters } from "./post-filters.js";
import { SELECTORS } from "./selector-map.js";

export {
  extractCard,
  readDetailPhone,
  readDetailWebsite,
} from "./card-extract.js";

export type ScrapeProgressCallback = (found: number) => void | Promise<void>;
export type EnrichProgressCallback = (
  enriched: number,
  total: number,
) => void | Promise<void>;
export type ShouldAbortCallback = () => boolean | Promise<boolean>;

export interface PlaywrightMapsScraperOptions {
  maxResults?: number;
  concurrency?: number;
  fixturePath?: string;
  fixtureHtml?: string;
  browserPool?: BrowserPool;
  delayMs?: () => number;
  ownsBrowserPool?: boolean;
  onScrapeProgress?: ScrapeProgressCallback;
  onEnrichProgress?: EnrichProgressCallback;
  shouldAbort?: ShouldAbortCallback;
}

async function throwIfAborted(
  shouldAbort?: ShouldAbortCallback,
): Promise<void> {
  if (shouldAbort && (await shouldAbort())) {
    throw new SearchCancelledError();
  }
}

function defaultDelayMs(): number {
  return Math.floor(Math.random() * 2000) + 1000;
}

export async function detectCaptcha(page: Page): Promise<boolean> {
  return (await page.locator(SELECTORS.captcha).count()) > 0;
}

export async function assertNoCaptcha(page: Page): Promise<void> {
  if (await detectCaptcha(page)) {
    throw new CaptchaDetectedError();
  }
}

async function dismissCookieConsent(page: Page): Promise<void> {
  const consentButtons = [
    'button:has-text("Aceitar tudo")',
    'button:has-text("Accept all")',
    'button:has-text("Recusar tudo")',
    'button:has-text("Reject all")',
  ];

  for (const selector of consentButtons) {
    const button = page.locator(selector).first();
    try {
      if (await button.isVisible({ timeout: 2_000 })) {
        await button.click({ timeout: 2_000 });
        await page.waitForTimeout(500);
        return;
      }
    } catch {
      // Try next consent button variant.
    }
  }
}

async function waitForResultCards(page: Page): Promise<void> {
  const readyLocator = page
    .locator(SELECTORS.resultCard)
    .locator(`${SELECTORS.placeLink}, ${SELECTORS.businessName}`)
    .first();

  await page.locator(SELECTORS.resultsFeed).waitFor({
    state: "attached",
    timeout: 45_000,
  });
  await readyLocator.waitFor({ state: "attached", timeout: 45_000 });
}

export async function scrollAndExtract(
  page: Page,
  maxResults: number,
  delayMs: () => number = defaultDelayMs,
  onScrapeProgress?: ScrapeProgressCallback,
  shouldAbort?: ShouldAbortCallback,
): Promise<ScrapedBusiness[]> {
  await waitForResultCards(page);
  await onScrapeProgress?.(0);

  const feed = page.locator(SELECTORS.resultsFeed);
  const seenUrls = new Set<string>();
  const results: ScrapedBusiness[] = [];
  let previousCardCount = 0;
  let staleScrolls = 0;
  let lastReported = -1;

  const reportProgress = async () => {
    if (results.length !== lastReported) {
      lastReported = results.length;
      await onScrapeProgress?.(results.length);
    }
  };

  while (results.length < maxResults && staleScrolls < 3) {
    await throwIfAborted(shouldAbort);
    const cards = page.locator(SELECTORS.resultCard);
    const cardCount = await cards.count();

    for (let index = 0; index < cardCount && results.length < maxResults; index++) {
      const business = await extractCard(cards.nth(index));
      if (business && !seenUrls.has(business.mapsUrl)) {
        seenUrls.add(business.mapsUrl);
        results.push(business);
        await reportProgress();
      }
    }

    if (results.length >= maxResults) {
      break;
    }

    if (cardCount === previousCardCount) {
      staleScrolls += 1;
    } else {
      staleScrolls = 0;
    }
    previousCardCount = cardCount;

    await feed.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await page.waitForTimeout(delayMs());
  }

  return results.slice(0, maxResults);
}

async function buildResultCardIndex(
  page: Page,
): Promise<Map<string, ReturnType<Page["locator"]>>> {
  const cards = page.locator(SELECTORS.resultCard);
  const cardCount = await cards.count();
  const indexByKey = new Map<string, ReturnType<Page["locator"]>>();

  for (let index = 0; index < cardCount; index += 1) {
    const card = cards.nth(index);
    const summary = await extractCard(card);
    if (!summary) {
      continue;
    }

    indexByKey.set(summary.mapsUrl, card);
    indexByKey.set(summary.name, card);
  }

  return indexByKey;
}

export async function enrichFromDetailPanels(
  page: Page,
  businesses: ScrapedBusiness[],
  onEnrichProgress?: EnrichProgressCallback,
  shouldAbort?: ShouldAbortCallback,
): Promise<ScrapedBusiness[]> {
  const cardIndex = await buildResultCardIndex(page);
  const enriched: ScrapedBusiness[] = [];
  const total = businesses.length;

  for (let index = 0; index < businesses.length; index += 1) {
    await throwIfAborted(shouldAbort);
    const business = businesses[index]!;

    if (business.phone && business.website) {
      enriched.push(business);
      await onEnrichProgress?.(index + 1, total);
      continue;
    }

    const card =
      cardIndex.get(business.mapsUrl) ?? cardIndex.get(business.name);

    if (!card || (await card.count()) === 0) {
      enriched.push(business);
      await onEnrichProgress?.(index + 1, total);
      continue;
    }

    await card.click();

    try {
      await page
        .locator(
          `${SELECTORS.detailPanel}, ${SELECTORS.liveDetailPhone}, ${SELECTORS.detailPhone}`,
        )
        .first()
        .waitFor({ state: "attached", timeout: 5_000 });
    } catch {
      enriched.push(business);
      await onEnrichProgress?.(index + 1, total);
      continue;
    }

    const phone = business.phone ?? (await readDetailPhone(page));
    const website = business.website ?? (await readDetailWebsite(page));

    enriched.push({
      ...business,
      phone: phone || undefined,
      website,
    });
    await onEnrichProgress?.(index + 1, total);
  }

  return enriched;
}

export class PlaywrightMapsScraper implements MapsScraper {
  private readonly maxResults: number;
  private readonly delayMs: () => number;
  private readonly browserPool: BrowserPool;
  private readonly ownsBrowserPool: boolean;
  private readonly fixturePath?: string;
  private readonly fixtureHtml?: string;
  private readonly onScrapeProgress?: ScrapeProgressCallback;
  private readonly onEnrichProgress?: EnrichProgressCallback;
  private readonly shouldAbort?: ShouldAbortCallback;

  constructor(options: PlaywrightMapsScraperOptions = {}) {
    this.maxResults =
      options.maxResults ??
      Number.parseInt(process.env.SCRAPER_MAX_RESULTS ?? "120", 10);
    this.delayMs = options.delayMs ?? defaultDelayMs;
    this.fixturePath = options.fixturePath;
    this.fixtureHtml = options.fixtureHtml;
    this.onScrapeProgress = options.onScrapeProgress;
    this.onEnrichProgress = options.onEnrichProgress;
    this.shouldAbort = options.shouldAbort;
    this.ownsBrowserPool = options.ownsBrowserPool ?? !options.browserPool;
    this.browserPool =
      options.browserPool ??
      new BrowserPool({ maxConcurrency: options.concurrency });
  }

  async scrape(input: ScrapeSearchInput): Promise<ScrapedBusiness[]> {
    buildSearchQuery({
      segmentId: input.segmentId,
      subcategoryId: input.subcategoryId,
      city: input.city,
      state: input.state,
    });

    const context = await this.browserPool.acquireContext();
    try {
      const page = await context.newPage();
      await page.setViewportSize({ width: 1280, height: 900 });
      await this.loadPage(page, input);
      await assertNoCaptcha(page);

      const extracted = await scrollAndExtract(
        page,
        this.maxResults,
        this.delayMs,
        this.onScrapeProgress,
        this.shouldAbort,
      );
      console.log(
        `[search] Maps scroll finished found=${extracted.length}, enriching details…`,
      );
      const enriched = await enrichFromDetailPanels(
        page,
        extracted,
        this.onEnrichProgress,
        this.shouldAbort,
      );
      return applyPostFilters(enriched, input.filters);
    } finally {
      await this.browserPool.releaseContext(context);
      if (this.ownsBrowserPool) {
        await this.browserPool.close();
      }
    }
  }

  async close(): Promise<void> {
    if (this.ownsBrowserPool) {
      await this.browserPool.close();
    }
  }

  private async loadPage(page: Page, input: ScrapeSearchInput): Promise<void> {
    if (this.fixtureHtml) {
      await page.setContent(this.fixtureHtml, { waitUntil: "domcontentloaded" });
      return;
    }

    if (this.fixturePath) {
      const html = await readFile(this.fixturePath, "utf-8");
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      return;
    }

    const query = buildSearchQuery({
      segmentId: input.segmentId,
      subcategoryId: input.subcategoryId,
      city: input.city,
      state: input.state,
    });
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await dismissCookieConsent(page);
    await page.waitForTimeout(1_500);
  }
}

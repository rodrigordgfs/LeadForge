import { readFile } from "node:fs/promises";
import { buildSearchQuery } from "@leadforge/shared";
import type {
  MapsScraper,
  ScrapeSearchInput,
  ScrapedBusiness,
} from "@leadforge/shared";
import type { Locator, Page } from "playwright";
import { BrowserPool } from "./browser-pool.js";
import { CaptchaDetectedError } from "./errors.js";
import { applyPostFilters } from "./post-filters.js";
import { SELECTORS } from "./selector-map.js";

export interface PlaywrightMapsScraperOptions {
  maxResults?: number;
  concurrency?: number;
  fixturePath?: string;
  fixtureHtml?: string;
  browserPool?: BrowserPool;
  delayMs?: () => number;
  ownsBrowserPool?: boolean;
}

function defaultDelayMs(): number {
  return Math.floor(Math.random() * 2000) + 1000;
}

function parseOptionalNumber(value: string | null | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseOptionalInt(value: string | null | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function detectCaptcha(page: Page): Promise<boolean> {
  return (await page.locator(SELECTORS.captcha).count()) > 0;
}

export async function assertNoCaptcha(page: Page): Promise<void> {
  if (await detectCaptcha(page)) {
    throw new CaptchaDetectedError();
  }
}

export async function extractCard(card: Locator): Promise<ScrapedBusiness | null> {
  const name = (await card.locator(SELECTORS.businessName).textContent())?.trim();
  const mapsUrl =
    (await card.locator(SELECTORS.mapsLink).getAttribute("href")) ??
    (await card.getAttribute("data-maps-url"));

  if (!name || !mapsUrl) {
    return null;
  }

  const category =
    (await card.locator(SELECTORS.category).textContent())?.trim() ?? "";
  const address =
    (await card.locator(SELECTORS.address).textContent())?.trim() ?? "";
  const city = (await card.locator(SELECTORS.city).textContent())?.trim() ?? "";
  const state =
    (await card.locator(SELECTORS.state).textContent())?.trim() ?? "";
  const phone =
    (await card.locator(SELECTORS.phone).textContent())?.trim() || undefined;
  const websiteRaw =
    (await card.locator(SELECTORS.website).getAttribute("href")) ?? undefined;
  const website =
    websiteRaw && websiteRaw !== "#" ? websiteRaw : undefined;
  const rating = parseOptionalNumber(
    await card.locator(SELECTORS.rating).textContent(),
  );
  const reviewCount = parseOptionalInt(
    await card.locator(SELECTORS.reviewCount).textContent(),
  );

  return {
    name,
    category,
    address,
    city,
    state,
    phone,
    website,
    rating,
    reviewCount,
    mapsUrl,
  };
}

export async function scrollAndExtract(
  page: Page,
  maxResults: number,
  delayMs: () => number = defaultDelayMs,
): Promise<ScrapedBusiness[]> {
  const feed = page.locator(SELECTORS.resultsFeed);
  await feed.waitFor({ state: "attached" });

  const seenUrls = new Set<string>();
  const results: ScrapedBusiness[] = [];
  let previousCardCount = 0;
  let staleScrolls = 0;

  while (results.length < maxResults && staleScrolls < 3) {
    const cards = page.locator(SELECTORS.resultCard);
    const cardCount = await cards.count();

    for (let index = 0; index < cardCount && results.length < maxResults; index++) {
      const business = await extractCard(cards.nth(index));
      if (business && !seenUrls.has(business.mapsUrl)) {
        seenUrls.add(business.mapsUrl);
        results.push(business);
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

export async function enrichFromDetailPanels(
  page: Page,
  businesses: ScrapedBusiness[],
): Promise<ScrapedBusiness[]> {
  const enriched: ScrapedBusiness[] = [];

  for (const business of businesses) {
    if (business.phone && business.website) {
      enriched.push(business);
      continue;
    }

    const card = page
      .locator(SELECTORS.resultCard)
      .filter({
        has: page.locator(`${SELECTORS.mapsLink}[href="${business.mapsUrl}"]`),
      })
      .first();

    if ((await card.count()) === 0) {
      enriched.push(business);
      continue;
    }

    await card.click();
    await page.locator(SELECTORS.detailPanel).waitFor({ state: "visible" });

    const phone =
      business.phone ??
      (await page.locator(SELECTORS.detailPhone).textContent())?.trim();
    const websiteRaw =
      business.website ??
      (await page.locator(SELECTORS.detailWebsite).getAttribute("href")) ??
      undefined;
    const website =
      websiteRaw && websiteRaw !== "#" ? websiteRaw : undefined;

    enriched.push({
      ...business,
      phone: phone || undefined,
      website,
    });
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

  constructor(options: PlaywrightMapsScraperOptions = {}) {
    this.maxResults =
      options.maxResults ??
      Number.parseInt(process.env.SCRAPER_MAX_RESULTS ?? "120", 10);
    this.delayMs = options.delayMs ?? defaultDelayMs;
    this.fixturePath = options.fixturePath;
    this.fixtureHtml = options.fixtureHtml;
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
      await this.loadPage(page, input);
      await assertNoCaptcha(page);

      const extracted = await scrollAndExtract(page, this.maxResults, this.delayMs);
      const enriched = await enrichFromDetailPanels(page, extracted);
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
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }
}

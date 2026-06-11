import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BrowserPool } from "../src/scraper/browser-pool.js";
import { CaptchaDetectedError } from "../src/scraper/errors.js";
import {
  PlaywrightMapsScraper,
  assertNoCaptcha,
  scrollAndExtract,
} from "../src/scraper/maps-scraper.js";
import { applyPostFilters } from "../src/scraper/post-filters.js";
import { createMockBrowser, createMockPage } from "./helpers/mock-page.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, "../fixtures/maps-results.html");

const searchInput = {
  segmentId: "alimentacao",
  subcategoryId: "padaria",
  state: "SP" as const,
  city: "São Paulo",
  radiusKm: 10,
};

function buildResultsHtml(cardCount: number): string {
  const cards = Array.from({ length: cardCount }, (_, index) => {
    const cid = index + 1;
    return `
      <div role="article" data-maps-url="https://maps.google.com/?cid=${cid}">
        <a data-testid="business-name" href="https://maps.google.com/?cid=${cid}">Business ${cid}</a>
        <span data-testid="category">Category</span>
        <span data-testid="address">Rua ${cid}</span>
        <span data-testid="city">São Paulo</span>
        <span data-testid="state">SP</span>
        <span data-testid="phone">(11) 90000-${String(cid).padStart(4, "0")}</span>
        <a data-testid="website" href="https://business-${cid}.example.com">Site</a>
        <span data-testid="rating">4.0</span>
        <span data-testid="review-count">10</span>
        <a data-testid="maps-link" href="https://maps.google.com/?cid=${cid}">Maps</a>
      </div>`;
  }).join("\n");

  return `<!doctype html><html><body><div role="feed">${cards}</div></body></html>`;
}

async function createScraperFromFixture(
  fixturePath: string = FIXTURE_PATH,
  options: { maxResults?: number } = {},
): Promise<PlaywrightMapsScraper> {
  const html = await readFile(fixturePath, "utf-8");
  return new PlaywrightMapsScraper({
    fixtureHtml: html,
    maxResults: options.maxResults,
    delayMs: () => 0,
    ownsBrowserPool: true,
    browserPool: new BrowserPool({
      maxConcurrency: 2,
      launchBrowser: async () => createMockBrowser(html),
    }),
  });
}

describe("PlaywrightMapsScraper unit tests", () => {
  it("fixture HTML extraction returns 3 businesses with name and mapsUrl", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const page = createMockPage(html);
    const businesses = await scrollAndExtract(page, 120, () => 0);

    expect(businesses).toHaveLength(3);
    for (const business of businesses) {
      expect(business.name).toBeTruthy();
      expect(business.mapsUrl).toMatch(/^https:\/\/maps\.google\.com\/\?cid=/);
    }
  });

  it("throws CaptchaDetectedError when CAPTCHA element is present", async () => {
    const page = createMockPage(
      `<html><body><div data-testid="captcha">Verify you are human</div></body></html>`,
    );

    await expect(assertNoCaptcha(page)).rejects.toBeInstanceOf(CaptchaDetectedError);
  });

  it("stops at SCRAPER_MAX_RESULTS=120 even if more cards exist", async () => {
    const page = createMockPage(buildResultsHtml(130));
    const businesses = await scrollAndExtract(page, 120, () => 0);

    expect(businesses).toHaveLength(120);
  });

  it("post-filter minRating=4.0 excludes business with rating 3.5", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const page = createMockPage(html);
    const businesses = await scrollAndExtract(page, 120, () => 0);
    const filtered = applyPostFilters(businesses, { minRating: 4.0 });

    expect(filtered.map((business) => business.name)).toEqual([
      "Padaria Central",
      "Clínica Saúde",
    ]);
  });

  it("post-filter noWebsite excludes businesses with website URL", async () => {
    const html = await readFile(FIXTURE_PATH, "utf-8");
    const page = createMockPage(html);
    const businesses = await scrollAndExtract(page, 120, () => 0);
    const filtered = applyPostFilters(businesses, { noWebsite: true });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Clínica Saúde");
  });
});

describe("PlaywrightMapsScraper integration", () => {
  it("scrape against local HTML fixture returns expected ScrapedBusiness array", async () => {
    const scraper = await createScraperFromFixture();
    const results = await scraper.scrape(searchInput);

    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({
      name: "Padaria Central",
      mapsUrl: "https://maps.google.com/?cid=1001",
      rating: 4.5,
      website: "https://padariacentral.com.br",
    });
    expect(results[1]).toMatchObject({
      name: "Lanchonete Popular",
      rating: 3.5,
    });
    expect(results[2]).toMatchObject({
      name: "Clínica Saúde",
      phone: "(11) 98765-4321",
      website: "https://clinicasaude.com.br",
    });
  });

  it("scrape with minRating filter returns only qualifying businesses", async () => {
    const scraper = await createScraperFromFixture();
    const results = await scraper.scrape({
      ...searchInput,
      filters: { minRating: 4.0 },
    });

    expect(results).toHaveLength(2);
    expect(results.every((business) => (business.rating ?? 0) >= 4.0)).toBe(true);
  });
});

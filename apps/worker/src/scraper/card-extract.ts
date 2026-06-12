import type { Locator, Page } from "playwright";
import type { ScrapedBusiness } from "@leadforge/shared";
import { SELECTORS } from "./selector-map.js";

const FIELD_TIMEOUT_MS = 3_000;

async function locatorCount(locator: Locator): Promise<number> {
  return locator.count();
}

async function safeText(locator: Locator): Promise<string | null> {
  if ((await locatorCount(locator)) === 0) {
    return null;
  }

  try {
    return (
      (await locator.first().textContent({ timeout: FIELD_TIMEOUT_MS }))?.trim() ??
      null
    );
  } catch {
    return null;
  }
}

async function safeAttr(
  locator: Locator,
  name: string,
): Promise<string | null> {
  if ((await locatorCount(locator)) === 0) {
    return null;
  }

  try {
    return (
      (await locator.first().getAttribute(name, { timeout: FIELD_TIMEOUT_MS })) ??
      null
    );
  } catch {
    return null;
  }
}

function parseOptionalNumber(value: string | null | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = value.replace(",", ".").match(/[\d.]+/)?.[0];
  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseOptionalInt(value: string | null | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const match = value.match(/(\d[\d.,]*)/);
  if (!match?.[1]) {
    return undefined;
  }

  const parsed = Number.parseInt(match[1].replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseCityState(text: string | null): { city: string; state: string } {
  if (!text?.trim()) {
    return { city: "", state: "" };
  }

  const dashMatch = text.match(/,\s*([^,-]+)\s*-\s*([A-Z]{2})\b/);
  if (dashMatch) {
    return { city: dashMatch[1]?.trim() ?? "", state: dashMatch[2] ?? "" };
  }

  const commaMatch = text.match(/,\s*([^,]+),\s*([A-Z]{2})\b/);
  if (commaMatch) {
    return { city: commaMatch[1]?.trim() ?? "", state: commaMatch[2] ?? "" };
  }

  return { city: "", state: "" };
}

async function readFixtureField(
  card: Locator,
  selector: string,
): Promise<string | null> {
  return safeText(card.locator(selector));
}

async function resolvePlaceLink(card: Locator): Promise<Locator | null> {
  const fixtureLink = card.locator(SELECTORS.mapsLink);
  if ((await locatorCount(fixtureLink)) > 0) {
    return fixtureLink.first();
  }

  const liveLink = card.locator(SELECTORS.placeLink);
  if ((await locatorCount(liveLink)) > 0) {
    return liveLink.first();
  }

  return null;
}

async function resolveBusinessName(
  card: Locator,
  placeLink: Locator | null,
): Promise<string | null> {
  const fixtureName = await readFixtureField(card, SELECTORS.businessName);
  if (fixtureName) {
    return fixtureName;
  }

  if (placeLink) {
    const ariaLabel = await safeAttr(placeLink, "aria-label");
    if (ariaLabel?.trim()) {
      return ariaLabel.trim();
    }
  }

  const listingName = await safeText(card.locator(SELECTORS.listingName));
  if (listingName) {
    return listingName;
  }

  if (placeLink) {
    return safeText(placeLink);
  }

  return null;
}

async function resolveMapsUrl(
  card: Locator,
  placeLink: Locator | null,
): Promise<string | null> {
  const fixtureUrl = await safeAttr(card.locator(SELECTORS.mapsLink), "href");
  if (fixtureUrl) {
    return fixtureUrl;
  }

  const href = placeLink ? await safeAttr(placeLink, "href") : null;
  if (href) {
    return href.startsWith("http") ? href : `https://www.google.com${href}`;
  }

  return (await safeAttr(card, "data-maps-url")) ?? null;
}

async function readListingMeta(card: Locator): Promise<string[]> {
  const metaLocator = card.locator(SELECTORS.listingMeta);
  const count = await locatorCount(metaLocator);
  if (count === 0) {
    return [];
  }

  const lines: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const text = await safeText(metaLocator.nth(index));
    if (text) {
      lines.push(text);
    }
  }

  return lines;
}

export async function extractCard(card: Locator): Promise<ScrapedBusiness | null> {
  const placeLink = await resolvePlaceLink(card);
  const name = await resolveBusinessName(card, placeLink);
  const mapsUrl = await resolveMapsUrl(card, placeLink);

  if (!name || !mapsUrl) {
    return null;
  }

  const fixtureCategory = await readFixtureField(card, SELECTORS.category);
  const fixtureAddress = await readFixtureField(card, SELECTORS.address);
  const fixtureCity = await readFixtureField(card, SELECTORS.city);
  const fixtureState = await readFixtureField(card, SELECTORS.state);

  const metaLines = await readListingMeta(card);
  const category =
    fixtureCategory ??
    metaLines.find((line) => !line.includes("·") && line.length < 80) ??
    metaLines[0] ??
    "";

  const addressLine =
    fixtureAddress ??
    metaLines.find(
      (line) =>
        /\d/.test(line) ||
        line.includes("Rua") ||
        line.includes("Av") ||
        line.includes("Rod"),
    ) ??
    metaLines.at(-1) ??
    "";

  const parsedLocation = parseCityState(addressLine);
  const city = fixtureCity ?? parsedLocation.city;
  const state = fixtureState ?? parsedLocation.state;

  const phone =
    (await readFixtureField(card, SELECTORS.phone)) || undefined;
  const websiteRaw =
    (await safeAttr(card.locator(SELECTORS.website), "href")) ?? undefined;
  const website =
    websiteRaw && websiteRaw !== "#" ? websiteRaw : undefined;

  const rating =
    parseOptionalNumber(await readFixtureField(card, SELECTORS.rating)) ??
    parseOptionalNumber(await safeText(card.locator(SELECTORS.listingRating)));

  const reviewCount =
    parseOptionalInt(await readFixtureField(card, SELECTORS.reviewCount)) ??
    parseOptionalInt(
      await safeText(card.locator(SELECTORS.listingReviewCount)),
    ) ??
    parseOptionalInt(metaLines.join(" "));

  return {
    name,
    category,
    address: addressLine,
    city,
    state,
    phone: phone || undefined,
    website,
    rating,
    reviewCount,
    mapsUrl,
  };
}

export async function readDetailPhone(page: Page): Promise<string | undefined> {
  const root = page.locator("body");
  const fixture = await safeText(root.locator(SELECTORS.detailPhone));
  if (fixture) {
    return fixture;
  }

  const live = await safeText(root.locator(SELECTORS.liveDetailPhone));
  if (!live) {
    return undefined;
  }

  return live.replace(/^Phone:\s*/i, "").replace(/^Telefone:\s*/i, "").trim();
}

export async function readDetailWebsite(page: Page): Promise<string | undefined> {
  const root = page.locator("body");
  const fixtureHref = await safeAttr(
    root.locator(SELECTORS.detailWebsite),
    "href",
  );
  if (fixtureHref && fixtureHref !== "#") {
    return fixtureHref;
  }

  const liveHref = await safeAttr(
    root.locator(SELECTORS.liveDetailWebsite),
    "href",
  );
  if (liveHref && liveHref !== "#") {
    return liveHref;
  }

  return undefined;
}

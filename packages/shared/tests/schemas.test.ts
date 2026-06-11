import { describe, expect, it } from "vitest";
import {
  createSearchSchema,
  parseEnv,
  sseEventSchema,
  type ScrapedBusiness,
} from "../src/index.js";

describe("createSearchSchema", () => {
  it("rejects radiusKm=0 with descriptive Zod error", () => {
    const result = createSearchSchema.safeParse({
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/greater than or equal to 1/i);
    }
  });

  it('rejects invalid UF code "XX"', () => {
    const result = createSearchSchema.safeParse({
      segmentId: "saude",
      state: "XX",
      city: "Pelotas",
      radiusKm: 10,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid payload with optional filters", () => {
    const result = createSearchSchema.safeParse({
      segmentId: "saude",
      subcategoryId: "dentista",
      state: "RS",
      city: "Pelotas",
      radiusKm: 25,
      filters: {
        noWebsite: true,
        minRating: 4,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects radiusKm above 50", () => {
    const result = createSearchSchema.safeParse({
      segmentId: "saude",
      state: "RS",
      city: "Pelotas",
      radiusKm: 51,
    });

    expect(result.success).toBe(false);
  });
});

describe("env schema", () => {
  it("fails when OPENAI_API_KEY missing in production mode", () => {
    const result = parseEnv({
      DATABASE_URL: "postgresql://leadforge:leadforge@localhost:5434/leadforge",
      REDIS_URL: "redis://localhost:6379",
      NODE_ENV: "production",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("OPENAI_API_KEY"))).toBe(
        true,
      );
    }
  });
});

describe("sse event schema", () => {
  it("validates lead_analyzed payload shape", () => {
    const result = sseEventSchema.safeParse({
      type: "lead_analyzed",
      payload: {
        leadId: "lead_123",
        score: 42,
        scoreBand: "low",
        hasRealWebsite: false,
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("ScrapedBusiness serialization", () => {
  it("serializes to JSON and parses back without data loss", () => {
    const business: ScrapedBusiness = {
      name: "Auto Center Silva",
      category: "Auto Center",
      address: "Av. Bento Gonçalves 100",
      city: "Pelotas",
      state: "RS",
      phone: "+555399999999",
      website: undefined,
      rating: 4.8,
      reviewCount: 120,
      mapsUrl: "https://maps.google.com/?cid=123",
    };

    const roundTrip = JSON.parse(JSON.stringify(business)) as ScrapedBusiness;
    expect(roundTrip).toEqual(business);
  });
});

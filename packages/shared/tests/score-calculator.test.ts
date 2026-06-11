import { describe, expect, it } from "vitest";
import type { SiteAuditResult } from "../src/audit/types.js";
import { getScoreBand } from "../src/scoring/score-bands.js";
import {
  calculateDigitalScore,
  isHighOpportunity,
  isSocialOnlyUrl,
  type ScoreInput,
} from "../src/scoring/score-calculator.js";

const fullAudit = (overrides: Partial<SiteAuditResult> = {}): SiteAuditResult => ({
  hasRealWebsite: true,
  sslValid: true,
  mobileResponsive: true,
  ownDomain: true,
  seoBasics: {
    title: true,
    metaDescription: true,
    h1: true,
  },
  psi: {
    performanceScore: 90,
    lcp: 1.2,
    cls: 0.05,
    seoScore: 92,
  },
  problems: [],
  opportunities: [],
  ...overrides,
});

describe("calculateDigitalScore", () => {
  it("returns score in 0-40 band when there is no website and no audit", () => {
    const score = calculateDigitalScore({
      audit: null,
      socialSignals: {},
      googleBusiness: {},
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(40);
    expect(getScoreBand(score)).toBe("critical");
  });

  it("treats social-only URL as no real website and yields score <= 40", () => {
    expect(isSocialOnlyUrl("https://instagram.com/loja")).toBe(true);

    const score = calculateDigitalScore({
      audit: fullAudit({ hasRealWebsite: false }),
      socialSignals: { hasInstagram: true },
      googleBusiness: { rating: 4.5 },
    });

    expect(score).toBeLessThanOrEqual(40);
  });

  it("returns score in 81-100 band for full audit with PSI performanceScore=90", () => {
    const score = calculateDigitalScore({
      audit: fullAudit(),
      socialSignals: {
        hasInstagram: true,
        hasFacebook: true,
        activeSocial: true,
      },
      googleBusiness: {
        profileVerified: true,
        rating: 4.8,
        reviewCount: 100,
      },
    });

    expect(score).toBeGreaterThanOrEqual(81);
    expect(getScoreBand(score)).toBe("excellent");
  });
});

describe("isHighOpportunity", () => {
  it("returns true for score 55 with real website at default threshold 60", () => {
    expect(isHighOpportunity(55, true)).toBe(true);
  });

  it("returns false for score 65 with real website at default threshold 60", () => {
    expect(isHighOpportunity(65, true)).toBe(false);
  });

  it("returns true when there is no real website regardless of score", () => {
    expect(isHighOpportunity(80, false)).toBe(true);
  });
});

describe("getScoreBand", () => {
  it('returns "low" for score 45', () => {
    expect(getScoreBand(45)).toBe("low");
  });
});

describe("fixture audit integration", () => {
  it("produces expected score band for PSI fixture payload", () => {
    const input: ScoreInput = {
      audit: fullAudit({
        sslValid: false,
        seoBasics: {
          title: true,
          metaDescription: false,
          h1: false,
        },
        psi: {
          performanceScore: 50,
          lcp: 2.8,
          cls: 0.15,
          seoScore: 60,
        },
      }),
      socialSignals: { hasInstagram: true },
      googleBusiness: { profileVerified: true, rating: 4.2, reviewCount: 20 },
    };

    const score = calculateDigitalScore(input);
    expect(getScoreBand(score)).toBe("medium");
  });
});

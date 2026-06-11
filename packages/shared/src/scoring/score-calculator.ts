import type { GoogleBusinessSignals, SocialSignals } from "../audit/types.js";
import type { SiteAuditResult } from "../audit/types.js";

export interface ScoreInput {
  audit: SiteAuditResult | null;
  socialSignals: SocialSignals;
  googleBusiness: GoogleBusinessSignals;
}

export type ScoreBandLabel = "critical" | "low" | "medium" | "excellent";

export const SCORE_WEIGHTS = {
  website: 0.3,
  ssl: 0.1,
  mobile: 0.15,
  psi: 0.2,
  seo: 0.15,
  socialGbp: 0.1,
} as const;

export const DEFAULT_HIGH_OPPORTUNITY_THRESHOLD = 60;

export const SOCIAL_ONLY_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linktr.ee",
  "linktree.com",
] as const;

export function isSocialOnlyUrl(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }

  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    return SOCIAL_ONLY_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

function scoreSeoBasics(audit: SiteAuditResult): number {
  const checks = [
    audit.seoBasics.title,
    audit.seoBasics.metaDescription,
    audit.seoBasics.h1,
  ];
  const passed = checks.filter(Boolean).length;
  return (passed / checks.length) * 100;
}

function scoreSocialAndGbp(
  socialSignals: SocialSignals,
  googleBusiness: GoogleBusinessSignals,
): number {
  let points = 0;
  let maxPoints = 0;

  const socialFlags = [
    socialSignals.hasInstagram,
    socialSignals.hasFacebook,
    socialSignals.hasLinkedIn,
    socialSignals.hasTikTok,
  ];

  for (const flag of socialFlags) {
    maxPoints += 1;
    if (flag) {
      points += 1;
    }
  }

  if (socialSignals.activeSocial !== undefined) {
    maxPoints += 1;
    if (socialSignals.activeSocial) {
      points += 1;
    }
  }

  if (googleBusiness.profileVerified !== undefined) {
    maxPoints += 1;
    if (googleBusiness.profileVerified) {
      points += 1;
    }
  }

  if (googleBusiness.rating !== undefined) {
    maxPoints += 1;
    points += Math.min(googleBusiness.rating / 5, 1);
  }

  if (googleBusiness.reviewCount !== undefined) {
    maxPoints += 1;
    points += Math.min(googleBusiness.reviewCount / 50, 1);
  }

  if (maxPoints === 0) {
    return 0;
  }

  return (points / maxPoints) * 100;
}

function hasEffectiveWebsite(audit: SiteAuditResult | null): boolean {
  if (!audit?.hasRealWebsite) {
    return false;
  }
  return true;
}

export function calculateDigitalScore(input: ScoreInput): number {
  const { audit, socialSignals, googleBusiness } = input;

  if (!audit || !hasEffectiveWebsite(audit)) {
    const socialScore = scoreSocialAndGbp(socialSignals, googleBusiness);
    const partial =
      socialScore * SCORE_WEIGHTS.socialGbp +
      (googleBusiness.rating ? Math.min(googleBusiness.rating / 5, 1) * 10 : 0);
    return Math.min(40, Math.round(partial));
  }

  const websiteScore = audit.hasRealWebsite ? 100 : 0;
  const sslScore = audit.sslValid ? 100 : 0;
  const mobileScore = audit.mobileResponsive ? 100 : 0;
  const psiScore = audit.psi?.performanceScore ?? 0;
  const seoScore = scoreSeoBasics(audit);
  const socialGbpScore = scoreSocialAndGbp(socialSignals, googleBusiness);

  const weighted =
    websiteScore * SCORE_WEIGHTS.website +
    sslScore * SCORE_WEIGHTS.ssl +
    mobileScore * SCORE_WEIGHTS.mobile +
    psiScore * SCORE_WEIGHTS.psi +
    seoScore * SCORE_WEIGHTS.seo +
    socialGbpScore * SCORE_WEIGHTS.socialGbp;

  return Math.max(0, Math.min(100, Math.round(weighted)));
}

export function isHighOpportunity(
  score: number,
  hasRealWebsite: boolean,
  threshold: number = DEFAULT_HIGH_OPPORTUNITY_THRESHOLD,
): boolean {
  return !hasRealWebsite || score <= threshold;
}

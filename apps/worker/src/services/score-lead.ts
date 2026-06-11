import type { Lead } from "@leadforge/db";
import {
  calculateDigitalScore,
  getScoreBand,
  type GoogleBusinessSignals,
  type ScoreBandLabel,
  type SocialSignals,
} from "@leadforge/shared";
import type { MergedAuditResult } from "../audit/hybrid-auditor.js";

export interface LeadDiagnosis {
  audit: MergedAuditResult;
  psi_available: boolean;
  problems: string[];
  opportunities: string[];
}

export interface ScoredLeadResult {
  score: number;
  scoreBand: ScoreBandLabel;
  hasRealWebsite: boolean;
  diagnosisJson: LeadDiagnosis;
}

function buildSocialSignals(lead: Lead): SocialSignals {
  return {
    hasInstagram: Boolean(lead.instagram),
    hasFacebook: Boolean(lead.facebook),
    activeSocial: Boolean(lead.instagram || lead.facebook),
  };
}

function buildGoogleBusinessSignals(lead: Lead): GoogleBusinessSignals {
  return {
    profileVerified: true,
    rating: lead.rating ?? undefined,
    reviewCount: lead.reviewCount ?? undefined,
  };
}

export function scoreLeadFromAudit(
  lead: Lead,
  audit: MergedAuditResult,
): ScoredLeadResult {
  const score = calculateDigitalScore({
    audit,
    socialSignals: buildSocialSignals(lead),
    googleBusiness: buildGoogleBusinessSignals(lead),
  });

  const scoreBand = getScoreBand(score);

  const diagnosisJson: LeadDiagnosis = {
    audit,
    psi_available: audit.psi_available,
    problems: audit.problems,
    opportunities: audit.opportunities,
  };

  return {
    score,
    scoreBand,
    hasRealWebsite: audit.hasRealWebsite,
    diagnosisJson,
  };
}

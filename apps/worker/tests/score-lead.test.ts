import { describe, expect, it } from "vitest";
import type { Lead } from "@leadforge/db";
import { scoreLeadFromAudit } from "../src/services/score-lead.js";

const baseLead: Lead = {
  id: "lead-1",
  userId: "user-1",
  searchJobId: "job-1",
  name: "Auto Center",
  category: "Auto Center",
  address: "Rua 1",
  city: "Pelotas",
  state: "RS",
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  instagram: null,
  facebook: null,
  rating: 4.8,
  reviewCount: 20,
  mapsUrl: "https://maps.google.com/?cid=1",
  score: null,
  scoreBand: null,
  hasRealWebsite: false,
  diagnosisJson: null,
  status: "novo",
  autoPipelineTriggered: false,
  diagnosedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("scoreLeadFromAudit", () => {
  it("returns score <= 40 for lead with no website audit", () => {
    const scored = scoreLeadFromAudit(baseLead, {
      hasRealWebsite: false,
      sslValid: false,
      mobileResponsive: false,
      ownDomain: false,
      seoBasics: {
        title: false,
        metaDescription: false,
        h1: false,
      },
      problems: ["Empresa sem website"],
      opportunities: ["Criar site institucional"],
      psi_available: false,
    });

    expect(scored.score).toBeLessThanOrEqual(40);
    expect(scored.diagnosisJson.psi_available).toBe(false);
  });
});

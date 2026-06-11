import type { SiteAuditResult } from "@leadforge/shared";
import { prisma } from "@leadforge/db";

export interface LeadArtifactMeta {
  type: string;
  filename: string;
  sizeBytes: number;
}

export interface LeadDetailResult {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string;
  score: number | null;
  scoreBand: string | null;
  hasRealWebsite: boolean;
  status: string;
  autoPipelineTriggered: boolean;
  searchJobId: string;
  diagnosis: {
    problems?: string[];
    opportunities?: string[];
    wireframeStructure?: unknown;
  } | null;
  artifacts: LeadArtifactMeta[];
}

function parseDiagnosis(diagnosisJson: unknown): LeadDetailResult["diagnosis"] {
  if (!diagnosisJson || typeof diagnosisJson !== "object") {
    return null;
  }

  const audit = diagnosisJson as SiteAuditResult & {
    wireframeStructure?: unknown;
  };

  return {
    problems: audit.problems,
    opportunities: audit.opportunities,
    wireframeStructure: audit.wireframeStructure,
  };
}

export async function getLeadDetailForUser(
  userId: string,
  leadId: string,
): Promise<LeadDetailResult | null> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    include: {
      artifacts: {
        select: {
          type: true,
          filename: true,
          sizeBytes: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!lead) {
    return null;
  }

  return {
    id: lead.id,
    name: lead.name,
    category: lead.category,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    email: lead.email,
    website: lead.website,
    instagram: lead.instagram,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
    mapsUrl: lead.mapsUrl,
    score: lead.score,
    scoreBand: lead.scoreBand,
    hasRealWebsite: lead.hasRealWebsite,
    status: lead.status,
    autoPipelineTriggered: lead.autoPipelineTriggered,
    searchJobId: lead.searchJobId,
    diagnosis: parseDiagnosis(lead.diagnosisJson),
    artifacts: lead.artifacts.map((artifact) => ({
      type: artifact.type,
      filename: artifact.filename,
      sizeBytes: artifact.sizeBytes,
    })),
  };
}

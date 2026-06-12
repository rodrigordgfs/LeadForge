import type { LeadStatus, ScoreBand } from "@leadforge/db";
import { prisma } from "@leadforge/db";

export interface SearchLeadListItem {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  phone: string | null;
  whatsapp: string | null;
  score: number | null;
  scoreBand: ScoreBand | null;
  hasRealWebsite: boolean;
  autoPipelineTriggered: boolean;
  status: LeadStatus;
}

export interface ListSearchLeadsInput {
  userId: string;
  searchJobId: string;
  offset?: number;
  limit?: number;
}

export interface ListSearchLeadsResult {
  leads: SearchLeadListItem[];
  total: number;
}

const leadListSelect = {
  id: true,
  name: true,
  category: true,
  city: true,
  state: true,
  phone: true,
  whatsapp: true,
  score: true,
  scoreBand: true,
  hasRealWebsite: true,
  autoPipelineTriggered: true,
  status: true,
} as const;

export async function listSearchLeads(
  input: ListSearchLeadsInput,
): Promise<ListSearchLeadsResult | null> {
  const searchJob = await prisma.searchJob.findFirst({
    where: { id: input.searchJobId, userId: input.userId },
    select: { id: true },
  });

  if (!searchJob) {
    return null;
  }

  const offset = input.offset ?? 0;
  const limit = Math.min(input.limit ?? 20, 100);

  const where = {
    searchJobId: input.searchJobId,
    userId: input.userId,
  };

  const [leads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      select: leadListSelect,
      orderBy: { score: { sort: "asc", nulls: "last" } },
      skip: offset,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

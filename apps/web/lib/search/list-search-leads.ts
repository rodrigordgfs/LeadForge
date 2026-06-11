import { prisma, type Lead } from "@leadforge/db";

export interface ListSearchLeadsInput {
  userId: string;
  searchJobId: string;
  offset?: number;
  limit?: number;
}

export interface ListSearchLeadsResult {
  leads: Lead[];
  total: number;
}

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
      orderBy: { score: { sort: "asc", nulls: "last" } },
      skip: offset,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

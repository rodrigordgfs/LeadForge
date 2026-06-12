import { isHighOpportunity } from "@leadforge/shared";
import { prisma } from "@leadforge/db";
import { userSettingsSchema } from "@leadforge/shared";

export async function getDashboardStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settingsJson: true },
  });

  const settings = userSettingsSchema.parse(user?.settingsJson ?? {});
  const threshold = settings.highOpportunityThreshold;

  const [leads, recentSearches] = await Promise.all([
    prisma.lead.findMany({
      where: { userId },
      select: {
        status: true,
        score: true,
        hasRealWebsite: true,
      },
    }),
    prisma.searchJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        totalFound: true,
        _count: { select: { leads: true } },
      },
    }),
  ]);

  const byStatus = {
    novo: 0,
    em_contato: 0,
    interessado: 0,
    proposta_enviada: 0,
    negociacao: 0,
    fechado: 0,
    perdido: 0,
  };

  let highOpportunityCount = 0;

  for (const lead of leads) {
    byStatus[lead.status] += 1;

    if (
      lead.score != null &&
      isHighOpportunity(lead.score, lead.hasRealWebsite, threshold)
    ) {
      highOpportunityCount += 1;
    }
  }

  return {
    totalLeads: leads.length,
    byStatus,
    highOpportunityCount,
    recentSearches: recentSearches.map((search) => ({
      id: search.id,
      city: search.city,
      state: search.state,
      status: search.status,
      createdAt: search.createdAt.toISOString(),
      totalFound: search.totalFound,
      leadCount: search._count.leads,
    })),
  };
}

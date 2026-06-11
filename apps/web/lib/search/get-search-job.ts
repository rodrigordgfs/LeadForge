import { prisma } from "@leadforge/db";

export interface SearchJobDetail {
  id: string;
  userId: string;
  segmentId: string;
  subcategoryId: string | null;
  state: string;
  city: string;
  radiusKm: number;
  status: string;
  progressPct: number;
  totalFound: number;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  leadCount: number;
}

export async function getSearchJobForUser(
  userId: string,
  searchJobId: string,
): Promise<SearchJobDetail | null> {
  const job = await prisma.searchJob.findFirst({
    where: { id: searchJobId, userId },
    include: {
      _count: { select: { leads: true } },
    },
  });

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    userId: job.userId,
    segmentId: job.segmentId,
    subcategoryId: job.subcategoryId,
    state: job.state,
    city: job.city,
    radiusKm: job.radiusKm,
    status: job.status,
    progressPct: job.progressPct,
    totalFound: job.totalFound,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    leadCount: job._count.leads,
  };
}

import type { SearchJobStatus } from "@leadforge/db";
import { prisma } from "@leadforge/db";
import { getSegmentById, getSubcategoryById } from "@leadforge/shared";

export interface UserSearchListItem {
  id: string;
  segmentId: string;
  segmentName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  city: string;
  state: string;
  radiusKm: number;
  status: SearchJobStatus;
  progressPct: number;
  totalFound: number;
  leadCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

function resolveSegmentLabels(
  segmentId: string,
  subcategoryId: string | null,
): { segmentName: string; subcategoryName: string | null } {
  if (subcategoryId) {
    const subcategory = getSubcategoryById(subcategoryId);
    if (subcategory) {
      return {
        segmentName: subcategory.segmentName,
        subcategoryName: subcategory.name,
      };
    }
  }

  const segment = getSegmentById(segmentId);
  return {
    segmentName: segment?.name ?? segmentId,
    subcategoryName: null,
  };
}

export async function listUserSearches(
  userId: string,
  limit = 50,
): Promise<UserSearchListItem[]> {
  const jobs = await prisma.searchJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { leads: true } },
    },
  });

  return jobs.map((job) => {
    const { segmentName, subcategoryName } = resolveSegmentLabels(
      job.segmentId,
      job.subcategoryId,
    );

    return {
      id: job.id,
      segmentId: job.segmentId,
      segmentName,
      subcategoryId: job.subcategoryId,
      subcategoryName,
      city: job.city,
      state: job.state,
      radiusKm: job.radiusKm,
      status: job.status,
      progressPct: job.progressPct,
      totalFound: job.totalFound,
      leadCount: job._count.leads,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  });
}

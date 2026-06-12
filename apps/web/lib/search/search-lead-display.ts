import type { SearchJobStatus } from "@leadforge/db";

export interface SearchLeadCounts {
  status: SearchJobStatus | string;
  leadCount: number;
  totalFound: number;
}

export function formatSearchLeadLabel(search: SearchLeadCounts): string {
  const inProgress =
    search.status === "running" || search.status === "pending";

  if (inProgress && search.totalFound > search.leadCount) {
    if (search.leadCount === 0) {
      return `${search.totalFound} encontrados no Maps`;
    }

    return `${search.leadCount} leads · ${search.totalFound} no Maps`;
  }

  const count = search.leadCount;
  return count === 1 ? "1 lead" : `${count} leads`;
}

export function getSearchLeadSecondaryHint(
  search: SearchLeadCounts,
): string | null {
  const inProgress =
    search.status === "running" || search.status === "pending";

  if (inProgress && search.totalFound > search.leadCount) {
    return `${search.totalFound} encontrados no Maps`;
  }

  return null;
}

import { Skeleton } from "@leadforge/ui";
import { Suspense } from "react";

import { SearchHistoryView } from "@/components/search/search-history-view";

export default function BuscasPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" data-testid="buscas-page-loading">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      }
    >
      <SearchHistoryView />
    </Suspense>
  );
}

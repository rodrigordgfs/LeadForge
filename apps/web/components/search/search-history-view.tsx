"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
} from "@leadforge/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";

import { NewSearchDialog } from "@/components/search/new-search-dialog";
import type { UserSearchListItem } from "@/lib/search/list-user-searches";
import { SEARCH_JOB_STATUS_LABELS } from "@/lib/constants/labels";
import {
  formatSearchLeadLabel,
  getSearchLeadSecondaryHint,
} from "@/lib/search/search-lead-display";

function formatSearchDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeVariant(
  status: UserSearchListItem["status"],
): "default" | "secondary" | "critical" | "excellent" {
  switch (status) {
    case "completed":
      return "excellent";
    case "failed":
      return "critical";
    case "running":
      return "default";
    default:
      return "secondary";
  }
}

function SearchCard({ search }: { search: UserSearchListItem }) {
  const location = `${search.city}/${search.state}`;
  const category = search.subcategoryName
    ? `${search.segmentName} · ${search.subcategoryName}`
    : search.segmentName;

  return (
    <Link
      href={`/busca/${search.id}`}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid={`search-card-${search.id}`}
    >
      <Card className="h-full gap-0 py-0 transition-colors hover:bg-muted/40">
        <CardHeader className="gap-2 border-b px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{location}</CardTitle>
            <Badge variant={statusBadgeVariant(search.status)}>
              {SEARCH_JOB_STATUS_LABELS[search.status]}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{category}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Raio</dt>
              <dd className="font-mono font-medium text-foreground">
                {search.radiusKm} km
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Leads</dt>
              <dd className="font-medium text-foreground">
                <span className="font-mono">{search.leadCount}</span>
                {getSearchLeadSecondaryHint(search) ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                    {getSearchLeadSecondaryHint(search)}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Criada em</dt>
              <dd className="text-foreground">
                {formatSearchDate(search.createdAt)}
              </dd>
            </div>
          </dl>

          {search.status === "running" ? (
            <div className="space-y-1">
              <Progress value={search.progressPct} />
              <p className="font-mono text-xs text-muted-foreground">
                {search.progressPct}% · {search.totalFound} encontrados
              </p>
            </div>
          ) : null}

          {search.status === "failed" && search.errorMessage ? (
            <p className="line-clamp-2 text-xs text-destructive">
              {search.errorMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

export function SearchHistoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searches, setSearches] = useState<UserSearchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSearchOpen, setNewSearchOpen] = useState(false);

  const loadSearches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/searches");
      if (!response.ok) {
        throw new Error("Falha ao carregar buscas");
      }

      const data = (await response.json()) as { searches: UserSearchListItem[] };
      setSearches(data.searches);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Falha ao carregar buscas",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSearches();
  }, [loadSearches]);

  const openNewSearch = useCallback(() => {
    startTransition(() => setNewSearchOpen(true));
  }, []);

  useEffect(() => {
    if (searchParams.get("nova") === "1") {
      startTransition(() => setNewSearchOpen(true));
      router.replace("/buscas");
    }
  }, [searchParams, router]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Buscas</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de prospecções recentes. Clique em um card para ver os
            leads.
          </p>
        </div>
        <Button
          type="button"
          data-testid="open-new-search"
          onClick={openNewSearch}
        >
          Nova busca
        </Button>
      </header>

      <NewSearchDialog open={newSearchOpen} onOpenChange={setNewSearchOpen} />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="search-history-loading"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <Card className="gap-4 py-8" data-testid="search-history-empty">
          <CardContent className="px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma busca realizada ainda.
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={openNewSearch}
            >
              Criar primeira busca
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="search-history-grid"
        >
          {searches.map((search) => (
            <SearchCard key={search.id} search={search} />
          ))}
        </div>
      )}
    </section>
  );
}

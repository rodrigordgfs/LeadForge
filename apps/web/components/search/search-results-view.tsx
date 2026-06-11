"use client";

import { useCallback, useEffect, useState } from "react";

import { JobProgress } from "@/components/search/job-progress";
import { LeadList, type LeadListItem } from "@/components/leads/lead-list";
import { useJobEvents } from "@/hooks/use-job-events";

interface SearchResultsPageProps {
  searchId: string;
}

const PAGE_SIZE = 20;

export function SearchResultsView({ searchId }: SearchResultsPageProps) {
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [jobActive, setJobActive] = useState(true);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(
        `/api/searches/${searchId}/leads?offset=${offset}&limit=${PAGE_SIZE}`,
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar leads");
      }

      const data = (await response.json()) as {
        leads: LeadListItem[];
        total: number;
      };

      setLeads(data.leads);
      setTotal(data.total);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Falha ao carregar leads",
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchId, offset]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const jobState = useJobEvents(searchId, {
    enabled: jobActive,
    onLeadAnalyzed: () => {
      void fetchLeads();
    },
    onComplete: () => {
      setJobActive(false);
      void fetchLeads();
    },
    onFailed: () => {
      setJobActive(false);
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Resultados da busca
        </h1>
        <p className="text-sm text-slate-600">
          Leads ordenados por score (menor oportunidade primeiro).
        </p>
      </header>

      <JobProgress
        state={jobState}
        onRetry={() => {
          setJobActive(true);
          jobState.reset();
        }}
      />

      {fetchError ? (
        <p className="text-sm text-red-600" role="alert">
          {fetchError}
        </p>
      ) : null}

      <LeadList
        leads={leads}
        total={total}
        offset={offset}
        limit={PAGE_SIZE}
        isLoading={isLoading}
        onPageChange={setOffset}
      />
    </section>
  );
}

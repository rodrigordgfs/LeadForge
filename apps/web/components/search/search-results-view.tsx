"use client";

import { Alert, AlertDescription, Button } from "@leadforge/ui";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";

import { JobProgress } from "@/components/search/job-progress";
import { LeadList, type LeadListItem } from "@/components/leads/lead-list";
import { SimpleModal } from "@/components/ui/simple-modal";
import { useJobEvents } from "@/hooks/use-job-events";

interface SearchResultsPageProps {
  searchId: string;
}

const PAGE_SIZE = 20;

export function SearchResultsView({ searchId }: SearchResultsPageProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [jobActive, setJobActive] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/searches/${searchId}`);
        if (!response.ok || cancelled) {
          return;
        }

        const job = (await response.json()) as { status: string };
        if (job.status === "completed" || job.status === "failed") {
          setJobActive(false);
          void fetchLeads();
        }
      } catch {
        // Initial job sync is best-effort; SSE/polling may still update state.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchId, fetchLeads]);

  const jobState = useJobEvents(searchId, {
    enabled: jobActive,
    onLeadAnalyzed: () => {
      void fetchLeads();
    },
    onEvent: (event) => {
      if (event.type === "lead_scraped" || event.type === "progress") {
        void fetchLeads();
      }
    },
    onComplete: () => {
      setJobActive(false);
      void fetchLeads();
    },
    onFailed: () => {
      setJobActive(false);
      void fetchLeads();
    },
  });

  useEffect(() => {
    if (jobState.status === "completed" || jobState.status === "failed") {
      void fetchLeads();
    }
  }, [jobState.status, fetchLeads]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/searches/${searchId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Falha ao excluir a busca");
      }

      setDeleteOpen(false);
      router.push("/buscas");
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Falha ao excluir a busca",
      );
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Resultados da busca
          </h1>
          <p className="text-sm text-muted-foreground">
            Leads ordenados por score (menor oportunidade primeiro).
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
          data-testid="delete-search-button"
          onClick={() => startTransition(() => setDeleteOpen(true))}
        >
          Excluir busca
        </Button>
      </header>

      <SimpleModal
        open={deleteOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteOpen(false);
          }
        }}
        className="max-w-md"
        testId="delete-confirm-dialog"
        showCloseButton={!isDeleting}
      >
        <div className="space-y-4 p-6">
          <div className="space-y-2 pr-8">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Excluir busca?
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Esta ação remove a busca e todos os leads associados. Não pode ser
              desfeita.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              data-testid="confirm-delete-search"
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </div>
      </SimpleModal>

      <JobProgress
        state={jobState}
        onRetry={() => {
          void (async () => {
            const response = await fetch(`/api/searches/${searchId}/retry`, {
              method: "POST",
            });

            if (!response.ok) {
              const body = (await response.json().catch(() => null)) as {
                error?: string;
              } | null;
              setFetchError(body?.error ?? "Falha ao reiniciar a busca");
              return;
            }

            setFetchError(null);
            setJobActive(true);
            jobState.reset();
          })();
        }}
      />

      {fetchError ? (
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      ) : null}

      <LeadList
        leads={leads}
        total={total}
        offset={offset}
        limit={PAGE_SIZE}
        isLoading={isLoading}
        searchCompleted={
          jobState.status === "completed" || jobState.status === "failed"
        }
        onPageChange={setOffset}
      />
    </section>
  );
}

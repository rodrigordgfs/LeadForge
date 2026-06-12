"use client";

import type { LeadStatus, ScoreBand } from "@leadforge/db";
import { Badge, Button, Card, Skeleton } from "@leadforge/ui";
import Link from "next/link";

import { ScoreBadge } from "@/components/leads/score-badge";
import { WebsiteStatus } from "@/components/leads/website-status";

export interface LeadListItem {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  phone?: string | null;
  whatsapp?: string | null;
  score?: number | null;
  scoreBand?: ScoreBand | null;
  hasRealWebsite: boolean;
  autoPipelineTriggered: boolean;
  status: LeadStatus;
}

interface LeadListProps {
  leads: LeadListItem[];
  isLoading?: boolean;
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
  searchCompleted?: boolean;
}

function formatWhatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function LeadList({
  leads,
  isLoading = false,
  total,
  offset,
  limit,
  onPageChange,
  searchCompleted = false,
}: LeadListProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="lead-list-loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card
        className="border-dashed p-8 text-center shadow-none"
        data-testid="lead-list-empty"
      >
        <p className="text-sm text-muted-foreground">
          {searchCompleted
            ? "A busca terminou, mas nenhum negócio foi encontrado no Google Maps para este segmento e região."
            : "Nenhum lead encontrado ainda. Aguarde o progresso da busca."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="lead-list">
      <Card className="gap-0 py-0">
        <ul className="divide-y divide-border">
          {leads.map((lead) => (
            <li key={lead.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-base font-medium text-foreground hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {lead.category} · {lead.city}/{lead.state}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ScoreBadge score={lead.score} band={lead.scoreBand} />
                    <WebsiteStatus
                      hasRealWebsite={lead.hasRealWebsite}
                      score={lead.score}
                    />
                    {lead.autoPipelineTriggered ? (
                      <Badge variant="secondary">Pipeline automático</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {lead.whatsapp ? (
                    <Button size="sm" asChild>
                      <a
                        href={formatWhatsappLink(lead.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`whatsapp-${lead.id}`}
                      >
                        WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  {lead.phone ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${lead.phone}`}>Ligar</a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-mono">
          Página {currentPage} de {totalPages} ({total} leads)
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            data-testid="pagination-prev"
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange(offset + limit)}
            data-testid="pagination-next"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

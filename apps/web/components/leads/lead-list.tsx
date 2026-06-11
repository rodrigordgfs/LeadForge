"use client";

import type { LeadStatus, ScoreBand } from "@leadforge/db";
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
}: LeadListProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="lead-list-loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-lg bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-slate-300 p-8 text-center"
        data-testid="lead-list-empty"
      >
        <p className="text-sm text-slate-600">
          Nenhum lead encontrado ainda. Aguarde o progresso da busca.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="lead-list">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {leads.map((lead) => (
          <li key={lead.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <Link
                  href={`/leads/${lead.id}`}
                  className="text-base font-medium text-slate-900 hover:underline"
                >
                  {lead.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {lead.category} · {lead.city}/{lead.state}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={lead.score} band={lead.scoreBand} />
                  <WebsiteStatus
                    hasRealWebsite={lead.hasRealWebsite}
                    score={lead.score}
                  />
                  {lead.autoPipelineTriggered ? (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                      Pipeline automático
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.whatsapp ? (
                  <a
                    href={formatWhatsappLink(lead.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                    data-testid={`whatsapp-${lead.id}`}
                  >
                    WhatsApp
                  </a>
                ) : null}
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Ligar
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Página {currentPage} de {totalPages} ({total} leads)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40"
            data-testid="pagination-prev"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onPageChange(offset + limit)}
            className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40"
            data-testid="pagination-next"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}

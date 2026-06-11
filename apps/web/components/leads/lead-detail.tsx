"use client";

import type { LeadStatus, ScoreBand } from "@leadforge/db";
import { useCallback, useState } from "react";

import { ContactLog } from "@/components/crm/contact-log";
import { ArtifactList, type ArtifactMeta } from "@/components/leads/artifact-list";
import { DiagnosisPanel } from "@/components/leads/diagnosis-panel";
import { ScoreGauge } from "@/components/leads/score-gauge";
import { useJobEvents } from "@/hooks/use-job-events";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants/labels";

export interface LeadDetailData {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  mapsUrl: string;
  score?: number | null;
  scoreBand?: ScoreBand | null;
  hasRealWebsite: boolean;
  status: LeadStatus;
  autoPipelineTriggered: boolean;
  searchJobId: string;
  diagnosis?: {
    problems?: string[];
    opportunities?: string[];
    wireframeStructure?: unknown;
  } | null;
  artifacts: ArtifactMeta[];
}

interface LeadDetailProps {
  lead: LeadDetailData;
  onLeadUpdated?: (lead: LeadDetailData) => void;
}

function formatWhatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

function wireframePreviewFromDiagnosis(
  diagnosis: LeadDetailData["diagnosis"],
): string | null {
  const structure = diagnosis?.wireframeStructure;
  if (!structure) {
    return null;
  }

  return typeof structure === "string"
    ? structure
    : JSON.stringify(structure, null, 2);
}

export function LeadDetail({ lead, onLeadUpdated }: LeadDetailProps) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingArtifacts, setIsGeneratingArtifacts] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshLead = useCallback(async () => {
    const response = await fetch(`/api/leads/${currentLead.id}`);
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as LeadDetailData;
    setCurrentLead(data);
    onLeadUpdated?.(data);
  }, [currentLead.id, onLeadUpdated]);

  const handleStatusChange = async (status: LeadStatus) => {
    setActionError(null);

    const response = await fetch(`/api/leads/${currentLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setActionError(data.error ?? "Falha ao atualizar status");
      return;
    }

    const updated = (await response.json()) as LeadDetailData;
    setCurrentLead((prev) => ({ ...prev, ...updated }));
    onLeadUpdated?.({ ...currentLead, ...updated });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/leads/${currentLead.id}/analyze`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Falha ao enfileirar diagnóstico");
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Falha ao enfileirar diagnóstico",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateArtifacts = async () => {
    setIsGeneratingArtifacts(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/leads/${currentLead.id}/artifacts`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Falha ao enfileirar pacote");
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Falha ao enfileirar pacote",
      );
    } finally {
      setIsGeneratingArtifacts(false);
    }
  };

  const handleArtifactReady = useCallback(async () => {
    await refreshLead();
  }, [refreshLead]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {currentLead.name}
          </h1>
          <p className="text-sm text-slate-500">
            {currentLead.category} · {currentLead.address}, {currentLead.city}/
            {currentLead.state}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentLead.whatsapp ? (
            <a
              href={formatWhatsappLink(currentLead.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white"
            >
              WhatsApp
            </a>
          ) : null}
          {currentLead.phone ? (
            <a
              href={`tel:${currentLead.phone}`}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              Ligar
            </a>
          ) : null}
          {currentLead.website ? (
            <a
              href={currentLead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              Visitar site
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <ScoreGauge score={currentLead.score} band={currentLead.scoreBand} />

        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Status no CRM
            </span>
            <select
              value={currentLead.status}
              onChange={(event) =>
                void handleStatusChange(event.target.value as LeadStatus)
              }
              className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
              data-testid="crm-status-select"
            >
              {LEAD_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              data-testid="trigger-analyze"
            >
              {isAnalyzing ? "Enfileirando…" : "Gerar diagnóstico"}
            </button>
            <button
              type="button"
              onClick={() => void handleGenerateArtifacts()}
              disabled={isGeneratingArtifacts}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              data-testid="trigger-artifacts"
            >
              {isGeneratingArtifacts
                ? "Enfileirando…"
                : "Gerar pacote completo"}
            </button>
          </div>

          {actionError ? (
            <p className="text-sm text-red-600" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Diagnóstico</h2>
        <DiagnosisPanel
          problems={currentLead.diagnosis?.problems}
          opportunities={currentLead.diagnosis?.opportunities}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Artefatos</h2>
        <ArtifactList
          leadId={currentLead.id}
          artifacts={currentLead.artifacts}
          wireframePreview={wireframePreviewFromDiagnosis(currentLead.diagnosis)}
        />
        {(isGeneratingArtifacts || currentLead.autoPipelineTriggered) && (
          <p className="text-sm text-slate-500">
            Gerando artefatos… novos downloads aparecerão automaticamente.
          </p>
        )}
      </section>

      <ContactLog leadId={currentLead.id} />

      <LeadDetailSseListener
        searchJobId={currentLead.searchJobId}
        leadId={currentLead.id}
        onArtifactReady={handleArtifactReady}
      />
    </div>
  );
}

function LeadDetailSseListener({
  searchJobId,
  leadId,
  onArtifactReady,
}: {
  searchJobId: string;
  leadId: string;
  onArtifactReady: () => void;
}) {
  useJobEvents(searchJobId, {
    enabled: Boolean(searchJobId),
    onArtifactReady: (event) => {
      if (event.payload.leadId === leadId) {
        void onArtifactReady();
      }
    },
  });

  return null;
}

import type { LeadStatus } from "@leadforge/db";
import type { ScoreBandLabel } from "@leadforge/shared";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  interessado: "Interessado",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "novo",
  "em_contato",
  "interessado",
  "proposta_enviada",
  "negociacao",
  "fechado",
  "perdido",
];

export const SCORE_BAND_LABELS: Record<ScoreBandLabel, string> = {
  critical: "Crítico",
  low: "Baixo",
  medium: "Médio",
  excellent: "Excelente",
};

export type ScoreBandBadgeVariant = "critical" | "low" | "medium" | "excellent";

export const SCORE_BAND_COLORS: Record<ScoreBandLabel, ScoreBandBadgeVariant> = {
  critical: "critical",
  low: "low",
  medium: "medium",
  excellent: "excellent",
};

export const JOB_PHASE_LABELS: Record<string, string> = {
  pending: "Aguardando início",
  running: "Buscando negócios",
  scraping: "Coletando resultados",
  analyzing: "Analisando sites",
  completed: "Concluído",
  failed: "Falhou",
};

export const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  company_txt: "Empresa (TXT)",
  analysis_txt: "Análise (TXT)",
  website_brief_txt: "Brief do site (TXT)",
  proposal_pdf: "Proposta (PDF)",
  diagnosis_pdf: "Diagnóstico (PDF)",
  wireframe_pdf: "Wireframe (PDF)",
};

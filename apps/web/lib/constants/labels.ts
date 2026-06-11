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

export const SCORE_BAND_COLORS: Record<ScoreBandLabel, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  low: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  excellent: "bg-green-100 text-green-800 border-green-200",
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

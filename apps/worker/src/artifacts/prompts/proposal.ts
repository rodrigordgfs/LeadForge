import type { LeadPromptContext } from "../types.js";

export function buildProposalPrompt(context: LeadPromptContext): string {
  return [
    "Gere campos de proposta comercial em português do Brasil.",
    `Cliente: ${context.name}`,
    `Categoria: ${context.category}`,
    `Cidade: ${context.city}`,
    `Score digital: ${context.score}`,
    `Oportunidades: ${context.opportunities.join("; ") || "Presença digital"}`,
    "Responda em JSON com campos: scope, value, deadline, monthlyFee, observations.",
    "value e monthlyFee devem ser números em reais.",
  ].join("\n");
}

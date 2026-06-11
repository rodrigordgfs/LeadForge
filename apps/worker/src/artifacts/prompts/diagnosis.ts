import type { LeadPromptContext } from "../types.js";

export function buildDiagnosisPrompt(context: LeadPromptContext): string {
  const topProblems = context.problems.slice(0, 3).join("; ") || "Nenhum";

  return [
    "Você é um consultor de marketing digital brasileiro.",
    "Gere um diagnóstico narrativo em português do Brasil para a empresa abaixo.",
    `Empresa: ${context.name}`,
    `Categoria: ${context.category}`,
    `Cidade: ${context.city}/${context.state}`,
    `Score digital: ${context.score}`,
    `Principais problemas: ${topProblems}`,
    `Oportunidades: ${context.opportunities.join("; ") || "Nenhuma"}`,
    "Responda em JSON com o campo narrative (texto corrido, 2-3 parágrafos).",
  ].join("\n");
}

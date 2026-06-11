import type { LeadPromptContext } from "../types.js";

export function buildWireframePrompt(context: LeadPromptContext): string {
  return [
    "Você é um UX designer brasileiro.",
    "Crie a estrutura de wireframe para o site da empresa abaixo.",
    `Empresa: ${context.name}`,
    `Categoria: ${context.category}`,
    `Cidade: ${context.city}`,
    `Problemas: ${context.problems.join("; ") || "Nenhum"}`,
    "Responda em JSON com pages (array de objetos com name e sections).",
    "Cada section deve ter name e suggestedComponents (array de strings).",
  ].join("\n");
}

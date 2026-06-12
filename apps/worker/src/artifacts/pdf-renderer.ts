import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { registerGeistFonts } from "./pdf/fonts.js";

registerGeistFonts();
import type {
  DiagnosisResponse,
  ProposalResponse,
  WireframeResponse,
} from "./types.js";
import { DiagnosisTemplate } from "./pdf/diagnosis-template.js";
import { ProposalTemplate } from "./pdf/proposal-template.js";
import { WireframeTemplate } from "./pdf/wireframe-template.js";

export async function renderProposalPdf(
  leadName: string,
  proposal: ProposalResponse,
): Promise<Buffer> {
  const document = createElement(ProposalTemplate, { leadName, proposal });
  return Buffer.from(await renderToBuffer(document as ReactElement<DocumentProps>));
}

export async function renderDiagnosisPdf(
  leadName: string,
  diagnosis: DiagnosisResponse,
): Promise<Buffer> {
  const document = createElement(DiagnosisTemplate, { leadName, diagnosis });
  return Buffer.from(await renderToBuffer(document as ReactElement<DocumentProps>));
}

export async function renderWireframePdf(
  leadName: string,
  wireframe: WireframeResponse,
): Promise<Buffer> {
  const document = createElement(WireframeTemplate, { leadName, wireframe });
  return Buffer.from(await renderToBuffer(document as ReactElement<DocumentProps>));
}

import { prisma, type Artifact, type ArtifactType, type Proposal } from "@leadforge/db";

export const ARTIFACT_TYPE = {
  companyTxt: "company_txt",
  analysisTxt: "analysis_txt",
  websiteBriefTxt: "website_brief_txt",
  proposalPdf: "proposal_pdf",
  diagnosisPdf: "diagnosis_pdf",
  wireframePdf: "wireframe_pdf",
} as const satisfies Record<string, ArtifactType>;
import type { GeneratedTextArtifacts } from "./text-generator.js";
import {
  formatAnalysisTxt,
  formatCompanyTxt,
  formatWebsiteBriefTxt,
} from "./text-generator.js";
import {
  renderDiagnosisPdf,
  renderProposalPdf,
  renderWireframePdf,
} from "./pdf-renderer.js";
import type { ProposalResponse } from "./types.js";

export const MAX_ARTIFACT_SIZE_BYTES = 5 * 1024 * 1024;

export class ArtifactTooLargeError extends Error {
  readonly type: ArtifactType;
  readonly sizeBytes: number;

  constructor(type: ArtifactType, sizeBytes: number) {
    super(
      `Artifact ${type} exceeds maximum size of ${MAX_ARTIFACT_SIZE_BYTES} bytes (got ${sizeBytes})`,
    );
    this.name = "ArtifactTooLargeError";
    this.type = type;
    this.sizeBytes = sizeBytes;
  }
}

export interface ArtifactFileMeta {
  filename: string;
  mimeType: string;
}

export const ARTIFACT_FILE_META: Record<ArtifactType, ArtifactFileMeta> = {
  [ARTIFACT_TYPE.companyTxt]: {
    filename: "company.txt",
    mimeType: "text/plain",
  },
  [ARTIFACT_TYPE.analysisTxt]: {
    filename: "analysis.txt",
    mimeType: "text/plain",
  },
  [ARTIFACT_TYPE.websiteBriefTxt]: {
    filename: "website-brief.txt",
    mimeType: "text/plain",
  },
  [ARTIFACT_TYPE.proposalPdf]: {
    filename: "proposal.pdf",
    mimeType: "application/pdf",
  },
  [ARTIFACT_TYPE.diagnosisPdf]: {
    filename: "diagnosis.pdf",
    mimeType: "application/pdf",
  },
  [ARTIFACT_TYPE.wireframePdf]: {
    filename: "wireframe.pdf",
    mimeType: "application/pdf",
  },
};

export function encodeBase64(content: Buffer | string): string {
  const buffer = typeof content === "string" ? Buffer.from(content, "utf8") : content;
  return buffer.toString("base64");
}

export function decodeBase64(contentBase64: string): Buffer {
  return Buffer.from(contentBase64, "base64");
}

function assertArtifactSize(type: ArtifactType, sizeBytes: number): void {
  if (sizeBytes > MAX_ARTIFACT_SIZE_BYTES) {
    throw new ArtifactTooLargeError(type, sizeBytes);
  }
}

export async function upsertArtifact(
  leadId: string,
  type: ArtifactType,
  content: Buffer,
): Promise<Artifact> {
  assertArtifactSize(type, content.byteLength);

  const meta = ARTIFACT_FILE_META[type];
  const contentBase64 = encodeBase64(content);
  const existing = await prisma.artifact.findFirst({
    where: { leadId, type },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return prisma.artifact.update({
      where: { id: existing.id },
      data: {
        filename: meta.filename,
        mimeType: meta.mimeType,
        contentBase64,
        sizeBytes: content.byteLength,
      },
    });
  }

  return prisma.artifact.create({
    data: {
      leadId,
      type,
      filename: meta.filename,
      mimeType: meta.mimeType,
      contentBase64,
      sizeBytes: content.byteLength,
    },
  });
}

export async function upsertProposal(
  leadId: string,
  proposal: ProposalResponse,
): Promise<Proposal> {
  const data = {
    value: proposal.value,
    monthlyFee: proposal.monthlyFee,
    scope: proposal.scope,
    deadline: proposal.deadline,
    observations: proposal.observations,
    status: "draft",
  };

  const existing = await prisma.proposal.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return prisma.proposal.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.proposal.create({
    data: {
      leadId,
      ...data,
    },
  });
}

export interface StoredArtifactResult {
  type: ArtifactType;
  artifact: Artifact;
}

export async function storeAllArtifacts(
  leadId: string,
  leadName: string,
  generated: GeneratedTextArtifacts,
): Promise<StoredArtifactResult[]> {
  const companyTxtBuffer = Buffer.from(
    formatCompanyTxt(generated.companyTxt),
    "utf8",
  );
  const analysisTxtBuffer = Buffer.from(
    formatAnalysisTxt(generated.analysisTxt),
    "utf8",
  );
  const websiteBriefBuffer = Buffer.from(
    formatWebsiteBriefTxt(generated.websiteBriefTxt),
    "utf8",
  );

  const [wireframePdf, diagnosisPdf, proposalPdf] = await Promise.all([
    renderWireframePdf(leadName, generated.wireframe),
    renderDiagnosisPdf(leadName, generated.diagnosis),
    renderProposalPdf(leadName, generated.proposal),
  ]);

  const stored: StoredArtifactResult[] = [];

  stored.push({
    type: ARTIFACT_TYPE.companyTxt,
    artifact: await upsertArtifact(leadId, ARTIFACT_TYPE.companyTxt, companyTxtBuffer),
  });
  stored.push({
    type: ARTIFACT_TYPE.analysisTxt,
    artifact: await upsertArtifact(leadId, ARTIFACT_TYPE.analysisTxt, analysisTxtBuffer),
  });
  stored.push({
    type: ARTIFACT_TYPE.websiteBriefTxt,
    artifact: await upsertArtifact(
      leadId,
      ARTIFACT_TYPE.websiteBriefTxt,
      websiteBriefBuffer,
    ),
  });
  stored.push({
    type: ARTIFACT_TYPE.wireframePdf,
    artifact: await upsertArtifact(leadId, ARTIFACT_TYPE.wireframePdf, wireframePdf),
  });
  stored.push({
    type: ARTIFACT_TYPE.diagnosisPdf,
    artifact: await upsertArtifact(leadId, ARTIFACT_TYPE.diagnosisPdf, diagnosisPdf),
  });
  stored.push({
    type: ARTIFACT_TYPE.proposalPdf,
    artifact: await upsertArtifact(leadId, ARTIFACT_TYPE.proposalPdf, proposalPdf),
  });

  await upsertProposal(leadId, generated.proposal);

  return stored;
}

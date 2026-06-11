import { beforeEach, describe, expect, it, vi } from "vitest";

const leadFindUniqueMock = vi.fn();
const publishSseEventMock = vi.fn();
const generateAllMock = vi.fn();
const storeAllArtifactsMock = vi.fn();

vi.mock("@leadforge/db", () => ({
  ArtifactType: {
    company_txt: "company_txt",
    analysis_txt: "analysis_txt",
    website_brief_txt: "website_brief_txt",
    proposal_pdf: "proposal_pdf",
    diagnosis_pdf: "diagnosis_pdf",
    wireframe_pdf: "wireframe_pdf",
  },
  prisma: {
    lead: {
      findUnique: (...args: unknown[]) => leadFindUniqueMock(...args),
    },
  },
}));

import { ARTIFACT_TYPE } from "../src/artifacts/artifact-storage.js";
import {
  ARTIFACTS_JOB_TIMEOUT_MS,
  processArtifactsJob,
} from "../src/processors/artifacts-processor.js";

const baseLead = {
  id: "lead-1",
  userId: "user-1",
  searchJobId: "job-1",
  name: "Auto Center Silva",
  category: "Auto Center",
  address: "Rua 1",
  city: "Pelotas",
  state: "RS",
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  instagram: null,
  facebook: null,
  rating: 4.5,
  reviewCount: 10,
  mapsUrl: "https://maps.google.com/?cid=1",
  score: 35,
  scoreBand: "critical",
  hasRealWebsite: false,
  diagnosisJson: {
    problems: ["Não possui website"],
    opportunities: ["Site institucional"],
  },
  status: "novo",
  autoPipelineTriggered: true,
  diagnosedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const generatedArtifacts = {
  companyTxt: { nome: "Auto Center Silva" },
  analysisTxt: { score: 35 },
  websiteBriefTxt: { objetivo: "Leads" },
  wireframe: { pages: [] },
  diagnosis: { narrative: "Diagnóstico" },
  proposal: { scope: "Site", value: 4500, deadline: "30 dias", monthlyFee: 0, observations: "" },
};

function buildStoredArtifacts() {
  return [
    { type: ARTIFACT_TYPE.companyTxt, artifact: { id: "a1" } },
    { type: ARTIFACT_TYPE.analysisTxt, artifact: { id: "a2" } },
    { type: ARTIFACT_TYPE.websiteBriefTxt, artifact: { id: "a3" } },
    { type: ARTIFACT_TYPE.wireframePdf, artifact: { id: "a4" } },
    { type: ARTIFACT_TYPE.diagnosisPdf, artifact: { id: "a5" } },
    { type: ARTIFACT_TYPE.proposalPdf, artifact: { id: "a6" } },
  ];
}

describe("artifacts processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadFindUniqueMock.mockResolvedValue(baseLead);
    publishSseEventMock.mockResolvedValue(1);
    generateAllMock.mockResolvedValue(generatedArtifacts);
    storeAllArtifactsMock.mockResolvedValue(buildStoredArtifacts());
  });

  it("calls text generator then storage in correct order", async () => {
    const callOrder: string[] = [];
    generateAllMock.mockImplementation(async () => {
      callOrder.push("generate");
      return generatedArtifacts;
    });
    storeAllArtifactsMock.mockImplementation(async () => {
      callOrder.push("store");
      return buildStoredArtifacts();
    });

    await processArtifactsJob(
      { leadId: "lead-1", userId: "user-1" },
      {
        textGenerator: { generateAll: generateAllMock } as never,
        storeArtifacts: storeAllArtifactsMock,
        publishEvent: publishSseEventMock,
      },
    );

    expect(callOrder).toEqual(["generate", "store"]);
    expect(generateAllMock).toHaveBeenCalledWith(baseLead);
    expect(storeAllArtifactsMock).toHaveBeenCalledWith(
      "lead-1",
      "Auto Center Silva",
      generatedArtifacts,
    );
  });

  it("publishes artifact_ready SSE event with artifact type and leadId", async () => {
    await processArtifactsJob(
      { leadId: "lead-1", userId: "user-1" },
      {
        textGenerator: { generateAll: generateAllMock } as never,
        storeArtifacts: storeAllArtifactsMock,
        publishEvent: publishSseEventMock,
      },
    );

    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "artifact_ready",
      payload: {
        leadId: "lead-1",
        artifactType: ARTIFACT_TYPE.companyTxt,
      },
    });

    const artifactReadyCalls = publishSseEventMock.mock.calls.filter(
      ([, event]) => event.type === "artifact_ready",
    );
    expect(artifactReadyCalls).toHaveLength(6);
  });

  it("publishes job_completed after all artifacts are stored", async () => {
    await processArtifactsJob(
      { leadId: "lead-1", userId: "user-1" },
      {
        textGenerator: { generateAll: generateAllMock } as never,
        storeArtifacts: storeAllArtifactsMock,
        publishEvent: publishSseEventMock,
      },
    );

    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "job_completed",
      payload: {
        searchJobId: "job-1",
        totalFound: 6,
      },
    });
  });

  it("publishes job_failed and not job_completed on partial storage failure", async () => {
    storeAllArtifactsMock.mockRejectedValue(
      new Error("Storage failed after 3 artifacts"),
    );

    await expect(
      processArtifactsJob(
        { leadId: "lead-1", userId: "user-1" },
        {
          textGenerator: { generateAll: generateAllMock } as never,
          storeArtifacts: storeAllArtifactsMock,
          publishEvent: publishSseEventMock,
        },
      ),
    ).rejects.toThrow("Storage failed after 3 artifacts");

    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "job_failed",
      payload: {
        searchJobId: "job-1",
        errorMessage: "Storage failed after 3 artifacts",
      },
    });

    const completedCalls = publishSseEventMock.mock.calls.filter(
      ([, event]) => event.type === "job_completed",
    );
    expect(completedCalls).toHaveLength(0);
  });

  it("configures a 5 minute artifacts job timeout constant", () => {
    expect(ARTIFACTS_JOB_TIMEOUT_MS).toBe(5 * 60 * 1000);
  });
});

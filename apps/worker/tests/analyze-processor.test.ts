import { beforeEach, describe, expect, it, vi } from "vitest";

const leadFindUniqueMock = vi.fn();
const leadUpdateMock = vi.fn();
const publishSseEventMock = vi.fn();
const triggerPipelineMock = vi.fn();

vi.mock("@leadforge/db", () => ({
  prisma: {
    lead: {
      findUnique: (...args: unknown[]) => leadFindUniqueMock(...args),
      update: (...args: unknown[]) => leadUpdateMock(...args),
    },
  },
}));

import { processAnalyzeJob } from "../src/processors/analyze-processor.js";

const baseLead = {
  id: "lead-1",
  userId: "user-1",
  searchJobId: "job-1",
  name: "Auto Center",
  category: "Auto Center",
  address: "Rua 1",
  city: "Pelotas",
  state: "RS",
  phone: null,
  whatsapp: null,
  email: null,
  website: "https://auto.example.com",
  instagram: null,
  facebook: null,
  rating: 4.5,
  reviewCount: 10,
  mapsUrl: "https://maps.google.com/?cid=1",
  score: null,
  scoreBand: null,
  hasRealWebsite: false,
  diagnosisJson: null,
  status: "novo",
  autoPipelineTriggered: false,
  diagnosedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("analyze processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadFindUniqueMock.mockResolvedValue(baseLead);
    leadUpdateMock.mockResolvedValue({});
    publishSseEventMock.mockResolvedValue(1);
    triggerPipelineMock.mockResolvedValue({ triggered: true, threshold: 60 });
  });

  it("updates Lead row with score and diagnosis", async () => {
    const auditor = {
      auditWithMeta: vi.fn().mockResolvedValue({
        hasRealWebsite: true,
        sslValid: false,
        mobileResponsive: false,
        ownDomain: true,
        seoBasics: {
          title: true,
          metaDescription: false,
          h1: false,
        },
        problems: ["SEO básico incompleto"],
        opportunities: ["SEO local"],
        psi_available: false,
      }),
    };

    await processAnalyzeJob(
      { leadId: "lead-1", userId: "user-1", searchJobId: "job-1" },
      {
        auditor: auditor as never,
        publishEvent: publishSseEventMock,
        triggerPipeline: triggerPipelineMock,
      },
    );

    expect(leadUpdateMock).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: expect.objectContaining({
        score: expect.any(Number),
        scoreBand: expect.any(String),
        hasRealWebsite: true,
        diagnosisJson: expect.objectContaining({ psi_available: false }),
        diagnosedAt: expect.any(Date),
      }),
    });
  });

  it("publishes lead_analyzed SSE with score and autoPipelineTriggered", async () => {
    const auditor = {
      auditWithMeta: vi.fn().mockResolvedValue({
        hasRealWebsite: false,
        sslValid: false,
        mobileResponsive: false,
        ownDomain: false,
        seoBasics: {
          title: false,
          metaDescription: false,
          h1: false,
        },
        problems: ["Empresa sem website"],
        opportunities: ["Criar site"],
        psi_available: false,
      }),
    };

    await processAnalyzeJob(
      { leadId: "lead-1", userId: "user-1", searchJobId: "job-1" },
      {
        auditor: auditor as never,
        publishEvent: publishSseEventMock,
        triggerPipeline: triggerPipelineMock,
      },
    );

    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "lead_analyzed",
      payload: expect.objectContaining({
        leadId: "lead-1",
        score: expect.any(Number),
        autoPipelineTriggered: true,
      }),
    });
  });

  it("enqueues artifacts pipeline for high-opportunity lead", async () => {
    triggerPipelineMock.mockResolvedValue({ triggered: true, threshold: 60 });

    const auditor = {
      auditWithMeta: vi.fn().mockResolvedValue({
        hasRealWebsite: true,
        sslValid: false,
        mobileResponsive: false,
        ownDomain: true,
        seoBasics: {
          title: true,
          metaDescription: false,
          h1: false,
        },
        problems: ["SEO básico incompleto"],
        opportunities: ["SEO local"],
        psi_available: false,
      }),
    };

    await processAnalyzeJob(
      { leadId: "lead-1", userId: "user-1", searchJobId: "job-1" },
      {
        auditor: auditor as never,
        publishEvent: publishSseEventMock,
        triggerPipeline: triggerPipelineMock,
      },
    );

    expect(triggerPipelineMock).toHaveBeenCalledTimes(1);
  });

  it("does not auto-trigger artifacts for low-opportunity lead", async () => {
    triggerPipelineMock.mockResolvedValue({ triggered: false, threshold: 60 });

    const auditor = {
      auditWithMeta: vi.fn().mockResolvedValue({
        hasRealWebsite: true,
        sslValid: true,
        mobileResponsive: true,
        ownDomain: true,
        seoBasics: {
          title: true,
          metaDescription: true,
          h1: true,
        },
        psi: {
          performanceScore: 95,
          lcp: 1.1,
          cls: 0.01,
          seoScore: 95,
        },
        problems: [],
        opportunities: ["Otimização contínua"],
        psi_available: true,
      }),
    };

    await processAnalyzeJob(
      { leadId: "lead-1", userId: "user-1", searchJobId: "job-1" },
      {
        auditor: auditor as never,
        publishEvent: publishSseEventMock,
        triggerPipeline: triggerPipelineMock,
      },
    );

    expect(triggerPipelineMock).toHaveBeenCalled();
    expect(publishSseEventMock).toHaveBeenCalledWith("job-1", {
      type: "lead_analyzed",
      payload: expect.objectContaining({ autoPipelineTriggered: false }),
    });
  });

  it("scores lead without website <= 40 and triggers auto pipeline", async () => {
    leadFindUniqueMock.mockResolvedValue({ ...baseLead, website: null });
    triggerPipelineMock.mockResolvedValue({ triggered: true, threshold: 60 });

    await processAnalyzeJob(
      { leadId: "lead-1", userId: "user-1", searchJobId: "job-1" },
      {
        publishEvent: publishSseEventMock,
        triggerPipeline: triggerPipelineMock,
      },
    );

    const updateData = leadUpdateMock.mock.calls[0]?.[0]?.data;
    expect(updateData.score).toBeLessThanOrEqual(40);
    expect(triggerPipelineMock).toHaveBeenCalled();
  });
});

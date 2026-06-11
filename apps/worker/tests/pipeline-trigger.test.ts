import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const leadUpdateMock = vi.fn();
const enqueueArtifactsJobMock = vi.fn();

vi.mock("@leadforge/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUniqueMock(...args),
    },
    lead: {
      update: (...args: unknown[]) => leadUpdateMock(...args),
    },
  },
}));

vi.mock("@leadforge/queue", () => ({
  enqueueArtifactsJob: (...args: unknown[]) => enqueueArtifactsJobMock(...args),
}));

import { maybeTriggerArtifactsPipeline } from "../src/services/pipeline-trigger.js";

describe("pipeline trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUniqueMock.mockResolvedValue({ settingsJson: {} });
    enqueueArtifactsJobMock.mockResolvedValue("artifacts-job");
    leadUpdateMock.mockResolvedValue({});
  });

  it("triggers artifacts for score 55 with real website at default threshold", async () => {
    const result = await maybeTriggerArtifactsPipeline(
      "lead-1",
      "user-1",
      55,
      true,
      enqueueArtifactsJobMock,
    );

    expect(result.triggered).toBe(true);
    expect(enqueueArtifactsJobMock).toHaveBeenCalledWith({
      leadId: "lead-1",
      userId: "user-1",
    });
  });

  it("does not trigger artifacts for score 75 with real website", async () => {
    const result = await maybeTriggerArtifactsPipeline(
      "lead-1",
      "user-1",
      75,
      true,
      enqueueArtifactsJobMock,
    );

    expect(result.triggered).toBe(false);
    expect(enqueueArtifactsJobMock).not.toHaveBeenCalled();
  });

  it("uses custom threshold 50 to trigger artifacts for score 45", async () => {
    userFindUniqueMock.mockResolvedValue({
      settingsJson: { highOpportunityThreshold: 50 },
    });

    const result = await maybeTriggerArtifactsPipeline(
      "lead-1",
      "user-1",
      45,
      true,
      enqueueArtifactsJobMock,
    );

    expect(result.triggered).toBe(true);
    expect(result.threshold).toBe(50);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const userFindUniqueMock = vi.fn();
const userUpdateMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUniqueMock(...args),
      update: (...args: unknown[]) => userUpdateMock(...args),
    },
  },
}));

import { GET as getSettingsRoute, PATCH as patchSettingsRoute } from "@/app/api/settings/route";
import { parsePatchUserSettings } from "@/lib/settings/schema";
import { getUserSettings, updateUserSettings } from "@/lib/settings/user-settings";

describe("parsePatchUserSettings", () => {
  it("rejects threshold above 100", () => {
    expect(() =>
      parsePatchUserSettings({ highOpportunityThreshold: 150 }),
    ).toThrow();
  });
});

describe("updateUserSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists highOpportunityThreshold", async () => {
    userFindUniqueMock.mockResolvedValue({
      settingsJson: { highOpportunityThreshold: 60 },
    });
    userUpdateMock.mockResolvedValue({
      settingsJson: { highOpportunityThreshold: 55 },
    });

    const result = await updateUserSettings("user_1", {
      highOpportunityThreshold: 55,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settings.highOpportunityThreshold).toBe(55);
    }
    expect(userUpdateMock).toHaveBeenCalledOnce();
  });
});

describe("GET /api/settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await getSettingsRoute();

    expect(response.status).toBe(401);
  });

  it("returns merged default settings", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    userFindUniqueMock.mockResolvedValue({
      settingsJson: { highOpportunityThreshold: 60 },
    });

    const response = await getSettingsRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.highOpportunityThreshold).toBe(60);
  });
});

describe("PATCH /api/settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid threshold", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });

    const response = await patchSettingsRoute(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ highOpportunityThreshold: 150 }),
      }),
    );

    expect(response.status).toBe(400);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Settings integration", () => {
  it("PATCH settings persists highOpportunityThreshold to User.settingsJson", async () => {
    const { prisma } = await import("@leadforge/db");

    const userId = `settings-user-${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Settings User",
        email: `settings-${Date.now()}@example.com`,
        settingsJson: { highOpportunityThreshold: 60 },
      },
    });

    const updated = await updateUserSettings(userId, {
      highOpportunityThreshold: 45,
    });

    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.settings.highOpportunityThreshold).toBe(45);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(
      (user?.settingsJson as { highOpportunityThreshold: number })
        .highOpportunityThreshold,
    ).toBe(45);

    await prisma.user.delete({ where: { id: userId } });
  });
});

describe("getUserSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when user has no stored settings", async () => {
    userFindUniqueMock.mockResolvedValue(null);

    const settings = await getUserSettings("missing");

    expect(settings.highOpportunityThreshold).toBe(60);
  });
});

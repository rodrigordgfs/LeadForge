import { beforeEach, describe, expect, it, vi } from "vitest";

const { upsertMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    user: {
      upsert: upsertMock,
    },
  },
}));

import {
  DEFAULT_USER_SETTINGS,
  syncUserFromClerk,
  type ClerkUserData,
} from "@/lib/user-sync";

const baseUser: ClerkUserData = {
  id: "user_123",
  name: "Maria Silva",
  email: "maria@agencia.com.br",
  avatar: "https://example.com/avatar.png",
};

describe("syncUserFromClerk", () => {
  beforeEach(() => {
    upsertMock.mockReset();
  });

  it("creates User with default settingsJson threshold 60", async () => {
    upsertMock.mockResolvedValue({
      id: baseUser.id,
      settingsJson: DEFAULT_USER_SETTINGS,
    });

    await syncUserFromClerk(baseUser);

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      update: {
        name: baseUser.name,
        email: baseUser.email,
        avatar: baseUser.avatar,
      },
      create: {
        id: baseUser.id,
        name: baseUser.name,
        email: baseUser.email,
        avatar: baseUser.avatar,
        settingsJson: DEFAULT_USER_SETTINGS,
      },
    });
    expect(DEFAULT_USER_SETTINGS).toEqual({ highOpportunityThreshold: 60 });
  });

  it("updates name/email on subsequent login without duplicating", async () => {
    const updatedUser: ClerkUserData = {
      ...baseUser,
      name: "Maria S. Silva",
      email: "maria.nova@agencia.com.br",
      avatar: null,
    };

    upsertMock.mockResolvedValue({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });

    await syncUserFromClerk(updatedUser);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: updatedUser.id },
      update: {
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: null,
      },
      create: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: null,
        settingsJson: DEFAULT_USER_SETTINGS,
      },
    });
  });
});

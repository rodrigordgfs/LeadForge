import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const leadFindFirstMock = vi.fn();
const contactCreateMock = vi.fn();
const contactFindManyMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@leadforge/db", () => ({
  prisma: {
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirstMock(...args),
    },
    contact: {
      create: (...args: unknown[]) => contactCreateMock(...args),
      findMany: (...args: unknown[]) => contactFindManyMock(...args),
    },
  },
}));

import {
  GET as getContactsRoute,
  POST as postContactsRoute,
} from "@/app/api/leads/[id]/contacts/route";
import { createLeadContact } from "@/lib/contacts/lead-contacts";

describe("createLeadContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when notes are missing", async () => {
    const result = await createLeadContact({
      userId: "user_1",
      leadId: "lead_1",
      notes: "   ",
      status: "em_contato",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.message).toContain("notes");
    }
  });

  it("creates contact for owned lead", async () => {
    leadFindFirstMock.mockResolvedValue({ id: "lead_1" });
    contactCreateMock.mockResolvedValue({
      id: "contact_1",
      leadId: "lead_1",
      notes: "Called client",
    });

    const result = await createLeadContact({
      userId: "user_1",
      leadId: "lead_1",
      notes: "Called client",
      status: "em_contato",
    });

    expect(result.ok).toBe(true);
    expect(contactCreateMock).toHaveBeenCalledOnce();
  });
});

describe("POST /api/leads/:id/contacts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing notes", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });

    const response = await postContactsRoute(
      new Request("http://localhost/api/leads/lead_1/contacts", {
        method: "POST",
        body: JSON.stringify({
          status: "em_contato",
        }),
      }),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(400);
  });
});

describe("GET /api/leads/:id/contacts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for another user's lead", async () => {
    authMock.mockResolvedValue({ userId: "user_2" });
    leadFindFirstMock.mockResolvedValue(null);

    const response = await getContactsRoute(
      new Request("http://localhost/api/leads/lead_1/contacts"),
      { params: Promise.resolve({ id: "lead_1" }) },
    );

    expect(response.status).toBe(404);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScrapedBusiness } from "@leadforge/shared";

const leadFindFirstMock = vi.fn();
const leadCreateMock = vi.fn();
const leadUpdateMock = vi.fn();

vi.mock("@leadforge/db", () => ({
  prisma: {
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirstMock(...args),
      create: (...args: unknown[]) => leadCreateMock(...args),
      update: (...args: unknown[]) => leadUpdateMock(...args),
    },
  },
}));

import { upsertLeadFromScraped } from "../src/services/lead-upsert.js";

const business: ScrapedBusiness = {
  name: "Padaria Central",
  category: "Padaria",
  address: "Rua A, 10",
  city: "Pelotas",
  state: "RS",
  phone: "(53) 99999-0000",
  website: "https://padaria.example.com",
  rating: 4.5,
  reviewCount: 12,
  mapsUrl: "https://maps.google.com/?cid=123",
};

describe("upsertLeadFromScraped", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadFindFirstMock.mockResolvedValue(null);
    leadCreateMock.mockResolvedValue({ id: "lead-1", ...business });
  });

  it("maps ScrapedBusiness fields to Lead model correctly", async () => {
    await upsertLeadFromScraped(business, "job-1", "user-1");

    expect(leadCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        searchJobId: "job-1",
        name: business.name,
        category: business.category,
        address: business.address,
        city: business.city,
        state: business.state,
        phone: business.phone,
        website: business.website,
        rating: business.rating,
        reviewCount: business.reviewCount,
        mapsUrl: business.mapsUrl,
        status: "novo",
      },
    });
  });

  it("updates existing lead when mapsUrl already exists in search job", async () => {
    leadFindFirstMock.mockResolvedValue({ id: "lead-existing" });
    leadUpdateMock.mockResolvedValue({ id: "lead-existing" });

    await upsertLeadFromScraped(business, "job-1", "user-1");

    expect(leadUpdateMock).toHaveBeenCalled();
    expect(leadCreateMock).not.toHaveBeenCalled();
  });
});

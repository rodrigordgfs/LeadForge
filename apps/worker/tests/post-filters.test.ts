import { describe, expect, it } from "vitest";
import type { ScrapedBusiness } from "@leadforge/shared";
import { applyPostFilters } from "../src/scraper/post-filters.js";

const sampleBusinesses: ScrapedBusiness[] = [
  {
    name: "High Rated",
    category: "Padaria",
    address: "Rua A",
    city: "São Paulo",
    state: "SP",
    website: "https://high.example.com",
    rating: 4.5,
    mapsUrl: "https://maps.google.com/?cid=1",
  },
  {
    name: "Low Rated",
    category: "Lanchonete",
    address: "Rua B",
    city: "São Paulo",
    state: "SP",
    website: "https://low.example.com",
    rating: 3.5,
    mapsUrl: "https://maps.google.com/?cid=2",
  },
  {
    name: "No Website",
    category: "Clínica",
    address: "Rua C",
    city: "São Paulo",
    state: "SP",
    rating: 4.8,
    mapsUrl: "https://maps.google.com/?cid=3",
  },
];

describe("applyPostFilters", () => {
  it("excludes businesses below minRating", () => {
    const filtered = applyPostFilters(sampleBusinesses, { minRating: 4.0 });

    expect(filtered.map((business) => business.name)).toEqual([
      "High Rated",
      "No Website",
    ]);
  });

  it("excludes businesses with website when noWebsite is true", () => {
    const filtered = applyPostFilters(sampleBusinesses, { noWebsite: true });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("No Website");
  });

  it("keeps only businesses with website when hasWebsite is true", () => {
    const filtered = applyPostFilters(sampleBusinesses, { hasWebsite: true });

    expect(filtered).toHaveLength(2);
    expect(filtered.every((business) => business.website)).toBe(true);
  });

  it("keeps only whatsapp-capable phone numbers when hasWhatsapp is true", () => {
    const businesses: ScrapedBusiness[] = [
      {
        ...sampleBusinesses[0]!,
        phone: "(11) 98765-4321",
      },
      {
        ...sampleBusinesses[1]!,
        phone: "(11) 3456-7890",
      },
    ];

    const filtered = applyPostFilters(businesses, { hasWhatsapp: true });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.phone).toBe("(11) 98765-4321");
  });
});

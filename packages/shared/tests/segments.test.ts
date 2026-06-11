import { describe, expect, it } from "vitest";
import {
  EXPECTED_SEGMENT_COUNT,
  buildSearchQuery,
  getAllSegments,
  getSegmentById,
  getSubcategoryById,
  segmentCatalog,
} from "../src/segments/loader.js";
import { createSearchSchema } from "../src/schemas/search.js";

describe("segment catalog", () => {
  it(`contains exactly ${EXPECTED_SEGMENT_COUNT} segments from init.md`, () => {
    expect(getAllSegments()).toHaveLength(EXPECTED_SEGMENT_COUNT);
    expect(segmentCatalog.segments).toHaveLength(EXPECTED_SEGMENT_COUNT);
  });

  it("getSegmentById('saude') returns segment with Dentista subcategory", () => {
    const segment = getSegmentById("saude");
    expect(segment).not.toBeNull();
    expect(segment?.subcategories.some((item) => item.id === "dentista")).toBe(
      true,
    );
  });

  it("getSegmentById('invalid') returns null", () => {
    expect(getSegmentById("invalid")).toBeNull();
  });

  it("buildSearchQuery returns Portuguese Maps query", () => {
    expect(
      buildSearchQuery({
        subcategoryId: "dentista",
        city: "Pelotas",
        state: "RS",
      }),
    ).toBe("Dentista em Pelotas RS");
  });

  it("getSubcategoryById resolves subcategory across segments", () => {
    const subcategory = getSubcategoryById("dentista");
    expect(subcategory?.segmentId).toBe("saude");
    expect(subcategory?.name).toBe("Dentista");
  });
});

describe("catalog integration with search schema examples", () => {
  it("accepts known segment and subcategory IDs", () => {
    const examples = [
      { segmentId: "automotivo", subcategoryId: "oficina-mecanica" },
      { segmentId: "saude", subcategoryId: "dentista" },
      { segmentId: "financeiro", subcategoryId: "seguros" },
    ];

    for (const example of examples) {
      expect(getSegmentById(example.segmentId)).not.toBeNull();
      expect(getSubcategoryById(example.subcategoryId)).not.toBeNull();

      const parsed = createSearchSchema.safeParse({
        segmentId: example.segmentId,
        subcategoryId: example.subcategoryId,
        state: "RS",
        city: "Pelotas",
        radiusKm: 10,
      });

      expect(parsed.success).toBe(true);
    }
  });
});

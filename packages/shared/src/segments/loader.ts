import catalogData from "./segments.json" with { type: "json" };
import {
  EXPECTED_SEGMENT_COUNT,
  SEGMENT_CATALOG_VERSION,
  type BuildSearchQueryInput,
  type Segment,
  type SegmentCatalog,
  type SegmentSubcategory,
} from "./types.js";

const catalog = catalogData as SegmentCatalog;

export function getAllSegments(): Segment[] {
  return catalog.segments;
}

export function getSegmentById(segmentId: string): Segment | null {
  return catalog.segments.find((segment) => segment.id === segmentId) ?? null;
}

export function getSubcategoryById(
  subcategoryId: string,
): (SegmentSubcategory & { segmentId: string; segmentName: string }) | null {
  for (const segment of catalog.segments) {
    const subcategory = segment.subcategories.find(
      (item) => item.id === subcategoryId,
    );
    if (subcategory) {
      return {
        ...subcategory,
        segmentId: segment.id,
        segmentName: segment.name,
      };
    }
  }
  return null;
}

export function buildSearchQuery(input: BuildSearchQueryInput): string {
  let label: string | undefined;

  if (input.subcategoryId) {
    const subcategory = getSubcategoryById(input.subcategoryId);
    if (!subcategory) {
      throw new Error(`Unknown subcategoryId: ${input.subcategoryId}`);
    }
    label = subcategory.name;
  } else if (input.segmentId) {
    const segment = getSegmentById(input.segmentId);
    if (!segment) {
      throw new Error(`Unknown segmentId: ${input.segmentId}`);
    }
    label = segment.name;
  }

  if (!label) {
    throw new Error("Either segmentId or subcategoryId is required");
  }

  return `${label} em ${input.city} ${input.state}`;
}

export function validateCatalog(): void {
  if (catalog.segments.length !== EXPECTED_SEGMENT_COUNT) {
    throw new Error(
      `Segment catalog must contain ${EXPECTED_SEGMENT_COUNT} segments, found ${catalog.segments.length}`,
    );
  }
}

export {
  catalog as segmentCatalog,
  EXPECTED_SEGMENT_COUNT,
  SEGMENT_CATALOG_VERSION,
};

validateCatalog();

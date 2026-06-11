export interface SegmentSubcategory {
  id: string;
  name: string;
}

export interface Segment {
  id: string;
  name: string;
  subcategories: SegmentSubcategory[];
}

export interface SegmentCatalog {
  version: string;
  segments: Segment[];
}

export interface BuildSearchQueryInput {
  segmentId?: string;
  subcategoryId?: string;
  city: string;
  state: string;
}

/** init.md defines 19 top-level industry segments (ADR-002 references 20). */
export const EXPECTED_SEGMENT_COUNT = 19;

export const SEGMENT_CATALOG_VERSION = "1.0.0";

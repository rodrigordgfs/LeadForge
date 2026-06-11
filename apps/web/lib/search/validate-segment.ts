import {
  getSegmentById,
  getSubcategoryById,
  type CreateSearchInput,
} from "@leadforge/shared";

export function validateSegmentInput(input: CreateSearchInput): string | null {
  const segment = getSegmentById(input.segmentId);
  if (!segment) {
    return `Invalid segmentId: ${input.segmentId}`;
  }

  if (input.subcategoryId) {
    const subcategory = getSubcategoryById(input.subcategoryId);
    if (!subcategory || subcategory.segmentId !== input.segmentId) {
      return `Invalid subcategoryId: ${input.subcategoryId}`;
    }
  }

  return null;
}

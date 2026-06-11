---
status: completed
title: Segment catalog (20 segments)
type: backend
complexity: low
dependencies:
  - task_04
---

# Task 05: Segment catalog (20 segments)

## Overview

Extract the 20 industry segments and subcategories from init.md into a versioned JSON catalog in `packages/shared`, with loader utilities for search query resolution. This enables fixed-segment search per ADR-002.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST include all 20 segments from init.md with subcategory arrays
- MUST assign stable string IDs to segments and subcategories (e.g., `automotivo`, `oficina-mecanica`)
- MUST provide `getSegmentById`, `getSubcategoryById`, and `buildSearchQuery(input)` functions
- MUST build Maps search query as `{subcategory} em {city} {state}` per TechSpec Playwright Maps Scraper Design
- MUST export catalog version constant for future migrations
</requirements>

## Subtasks

- [x] 5.1 Create `packages/shared/src/segments/segments.json` from init.md content
- [x] 5.2 Implement segment loader with ID lookup functions
- [x] 5.3 Implement `buildSearchQuery` for scraper input resolution
- [x] 5.4 Add validation that catalog contains exactly 20 top-level segments
- [x] 5.5 Export segment types and catalog from shared package

## Implementation Details

See init.md Segmentos section and TechSpec **Playwright Maps Scraper Design** step 1. Catalog is configuration, not hard-coded UI strings.

### Relevant Files

- `packages/shared/src/segments/segments.json`
- `packages/shared/src/segments/loader.ts`
- `packages/shared/src/segments/types.ts`

### Dependent Files

- `packages/shared/src/schemas/search.ts` — segmentId validated against catalog IDs

### Related ADRs

- [ADR-002: Brazil-First Market with Fixed Segment Catalog](../adrs/adr-002.md) — Fixed 20-segment catalog requirement
- [ADR-004: Playwright-Based Google Maps Lead Mining](../adrs/adr-004.md) — Query string format

## Deliverables

- Versioned segment catalog JSON with loader utilities
- `buildSearchQuery` function for scraper integration
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for catalog completeness **(REQUIRED)**

## Tests

- Unit tests:
  - [x] Catalog contains exactly 20 segments
  - [x] `getSegmentById('saude')` returns segment with Dentista subcategory
  - [x] `getSegmentById('invalid')` returns null or throws typed error
  - [x] `buildSearchQuery({ subcategoryId: 'dentista', city: 'Pelotas', state: 'RS' })` returns `"Dentista em Pelotas RS"`
- Integration tests:
  - [x] All subcategory IDs referenced in search schema examples exist in catalog
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All 20 init.md segments present with subcategories
- Search query builder produces Portuguese queries for scraper

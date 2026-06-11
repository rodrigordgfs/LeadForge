---
status: pending
title: Maps scraper Playwright module
type: backend
complexity: high
dependencies:
  - task_04
  - task_05
  - task_07
---

# Task 11: Maps scraper Playwright module

## Overview

Implement the Playwright-based Google Maps scraper module that extracts business listings by segment and location. This is a standalone module implementing the `MapsScraper` interface, testable with HTML fixtures without live Maps access in CI.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement MapsScraper interface from TechSpec Core Interfaces
- MUST navigate Google Maps search URL built from segment catalog query
- MUST scroll results feed with 1–3s random delays until 120 result cap or no new results
- MUST extract: name, category, address, city, state, phone, website, rating, reviewCount, mapsUrl
- MUST open detail panel when card data incomplete
- MUST abstract selectors in selector-map.ts for DOM change resilience
- MUST detect CAPTCHA and throw typed CaptchaDetectedError
- MUST apply post-filters from SearchFilters (min rating, has/doesn't have website)
- MUST NOT exceed SCRAPER_CONCURRENCY=2 browser contexts
</requirements>

## Subtasks

- [ ] 11.1 Create Playwright browser pool manager with concurrency limit
- [ ] 11.2 Implement selector-map abstraction for Maps DOM elements
- [ ] 11.3 Implement results feed scroll and card extraction loop
- [ ] 11.4 Implement detail panel enrichment for missing phone/website
- [ ] 11.5 Implement post-filter application on scraped results
- [ ] 11.6 Add HTML fixture tests with recorded Maps page snapshots
- [ ] 11.7 Export PlaywrightMapsScraper implementing MapsScraper interface

## Implementation Details

See TechSpec **Playwright Maps Scraper Design** section and ADR-004 implementation notes. Module lives in worker app but exports testable class.

### Relevant Files

- `apps/worker/src/scraper/maps-scraper.ts`
- `apps/worker/src/scraper/selector-map.ts`
- `apps/worker/src/scraper/browser-pool.ts`
- `apps/worker/src/scraper/errors.ts`
- `apps/worker/fixtures/maps-results.html`

### Dependent Files

- `packages/shared/src/segments/loader.ts` — buildSearchQuery
- `packages/shared/src/scraper/types.ts` — MapsScraper interface

### Related ADRs

- [ADR-004: Playwright-Based Google Maps Lead Mining](../adrs/adr-004.md) — Primary scraper design
- [ADR-002: Brazil-First Market with Fixed Segment Catalog](../adrs/adr-002.md) — Query language

## Deliverables

- PlaywrightMapsScraper class implementing MapsScraper
- Selector abstraction layer with fixture-based tests
- CAPTCHA detection with typed error
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests using HTML fixtures **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Fixture HTML extraction returns 3 businesses with name and mapsUrl
  - [ ] Post-filter minRating=4.0 excludes business with rating 3.5
  - [ ] Post-filter hasWebsite=false excludes businesses with website URL
  - [ ] CaptchaDetectedError thrown when CAPTCHA element present in fixture
  - [ ] Scraper stops at SCRAPER_MAX_RESULTS=120 even if more cards exist
- Integration tests:
  - [ ] PlaywrightMapsScraper.scrape against local HTML fixture returns expected ScrapedBusiness array
  - [ ] Browser pool rejects third concurrent context when SCRAPER_CONCURRENCY=2
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- MapsScraper interface fully implemented
- CI runs scraper tests without live Google Maps network calls

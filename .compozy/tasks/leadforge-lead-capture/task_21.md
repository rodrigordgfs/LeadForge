---
status: pending
title: Search form and SSE progress UI
type: frontend
complexity: medium
dependencies:
  - task_09
  - task_10
---

# Task 21: Search form and SSE progress UI

## Overview

Build the business search form UI with segment picker, location filters, and real-time SSE progress display. Users configure and launch searches from this screen.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST render search form with estado, cidade, raio, segment, optional subcategory selectors
- MUST load segment catalog from shared package for picker options
- MUST include PRD filters: possui site, avaliação mínima, possui WhatsApp, possui Instagram
- MUST submit form to POST /api/searches and redirect to results view with searchJobId
- MUST connect to SSE /api/jobs/:id/events showing progress bar and status messages
- MUST display progressPct and phase labels during job execution
- MUST handle job_failed with error message and retry button
- MUST use Brazilian Portuguese labels throughout
</requirements>

## Subtasks

- [ ] 21.1 Create search page layout at /busca
- [ ] 21.2 Build segment and subcategory cascading select from catalog
- [ ] 21.3 Build location and filter form fields with validation
- [ ] 21.4 Implement form submission calling search API
- [ ] 21.5 Implement SSE client hook with EventSource
- [ ] 21.6 Build progress UI component with phase indicators

## Implementation Details

See PRD **Business Search** filters and TechSpec **User Experience** step 1. Segment picker uses catalog from task_05 via API or direct import in client bundle.

### Relevant Files

- `apps/web/app/(app)/busca/page.tsx`
- `apps/web/components/search/search-form.tsx`
- `apps/web/components/search/job-progress.tsx`
- `apps/web/hooks/use-job-events.ts`

### Dependent Files

- `task_09` — POST /api/searches
- `task_10` — SSE endpoint
- `packages/shared/src/segments/segments.json` — catalog data

### Related ADRs

- [ADR-002: Brazil-First Market with Fixed Segment Catalog](../adrs/adr-002.md) — Segment picker UX

## Deliverables

- Search form page with all PRD filters
- SSE progress component with real-time updates
- useJobEvents hook for SSE subscription
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with mocked API and SSE **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] SearchForm renders all 20 segments in select dropdown
  - [ ] Subcategory select updates when parent segment changes
  - [ ] Form validation prevents submit with empty cidade field
  - [ ] useJobEvents updates progressPct on progress SSE event
  - [ ] useJobEvents calls onComplete callback on job_completed event
- Integration tests:
  - [ ] Form submit calls POST /api/searches with correct payload shape
  - [ ] Progress bar reaches 100% when job_completed event received in mock SSE stream
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- User can configure and submit search from UI
- Progress bar updates in real time via SSE during job execution

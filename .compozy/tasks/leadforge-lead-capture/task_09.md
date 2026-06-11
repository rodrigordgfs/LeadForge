---
status: pending
title: Search jobs REST API
type: backend
complexity: medium
dependencies:
  - task_07
  - task_08
---

# Task 09: Search jobs REST API

## Overview

Implement authenticated REST endpoints to create search jobs, retrieve job status, and list paginated leads for a search. Creating a search job persists a SearchJob record and enqueues the `search` BullMQ queue.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement POST /api/searches validating input with shared Zod schema
- MUST implement GET /api/searches/:id returning SearchJob status and lead counts
- MUST implement GET /api/searches/:id/leads with pagination sorted by score ASC (nulls last)
- MUST enqueue search queue job on POST with searchJobId payload
- MUST scope all queries to authenticated userId (no cross-tenant access)
- MUST return 404 when search job belongs to another user
</requirements>

## Subtasks

- [ ] 9.1 Implement POST /api/searches route handler
- [ ] 9.2 Implement GET /api/searches/:id route handler
- [ ] 9.3 Implement GET /api/searches/:id/leads with cursor or offset pagination
- [ ] 9.4 Wire search job enqueue on creation
- [ ] 9.5 Add authorization checks on all search routes
- [ ] 9.6 Return 201 with `{ searchJobId }` on successful creation

## Implementation Details

See TechSpec **API Endpoints** table rows for searches. Validate segmentId against segment catalog from task_05.

### Relevant Files

- `apps/web/app/api/searches/route.ts`
- `apps/web/app/api/searches/[id]/route.ts`
- `apps/web/app/api/searches/[id]/leads/route.ts`
- `apps/web/lib/search/create-search-job.ts`

### Dependent Files

- `packages/queue` — search queue enqueue
- `packages/shared` — CreateSearchSchema, segment validation
- `packages/db` — SearchJob, Lead models

### Related ADRs

- [ADR-004: Playwright-Based Google Maps Lead Mining](../adrs/adr-004.md) — Search job triggers scraper

## Deliverables

- Three search REST endpoints fully functional
- Search job creation with queue enqueue
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for full create-and-fetch flow **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] POST /api/searches with invalid segmentId returns 400
  - [ ] POST /api/searches with valid payload returns 201 and searchJobId
  - [ ] GET /api/searches/:id for another user's job returns 404
  - [ ] GET /api/searches/:id/leads returns leads sorted by score ascending
- Integration tests:
  - [ ] POST search creates SearchJob row with status pending in database
  - [ ] POST search enqueues BullMQ job with matching searchJobId
  - [ ] GET leads returns empty array for new search with zero scraped leads
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Authenticated user can create and retrieve own search jobs
- Invalid payloads rejected with descriptive 400 errors

---
status: pending
title: Search worker processor
type: backend
complexity: medium
dependencies:
  - task_09
  - task_10
  - task_11
---

# Task 12: Search worker processor

## Overview

Wire the search BullMQ processor that orchestrates Maps scraping, lead persistence, analyze job enqueueing, and SSE progress events. Also bootstrap the worker app entrypoint with search processor registration.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `apps/worker` entrypoint registering search queue processor
- MUST update SearchJob status: pending → running → completed/failed
- MUST upsert Lead records from ScrapedBusiness results linked to searchJobId and userId
- MUST enqueue analyze job for each persisted lead
- MUST publish SSE events: progress, lead_scraped, job_completed, job_failed
- MUST retry scraper up to 3 times on transient errors; fail on CaptchaDetectedError
- MUST set totalFound and progressPct on SearchJob during processing
</requirements>

## Subtasks

- [ ] 12.1 Create worker app bootstrap with BullMQ worker registration
- [ ] 12.2 Implement search processor handler calling PlaywrightMapsScraper
- [ ] 12.3 Persist scraped leads to PostgreSQL with status Novo
- [ ] 12.4 Enqueue analyze job per lead after persistence
- [ ] 12.5 Publish SSE progress events throughout processing
- [ ] 12.6 Handle job failure with errorMessage on SearchJob

## Implementation Details

See TechSpec **System Architecture** data flow steps 1–2. Worker runs as separate process from Next.js web app.

### Relevant Files

- `apps/worker/src/index.ts`
- `apps/worker/src/processors/search-processor.ts`
- `apps/worker/src/services/lead-upsert.ts`

### Dependent Files

- `task_11` — PlaywrightMapsScraper
- `task_10` — SSE event publisher
- `packages/queue` — search and analyze queues
- `packages/db` — SearchJob, Lead models

### Related ADRs

- [ADR-004: Playwright-Based Google Maps Lead Mining](../adrs/adr-004.md)
- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md)

## Deliverables

- Runnable worker process processing search queue jobs
- Lead persistence and analyze job fan-out
- SSE progress publishing during scrape
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with mocked scraper **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Search processor updates SearchJob status to running on start
  - [ ] Lead upsert maps ScrapedBusiness fields to Lead model correctly
  - [ ] CaptchaDetectedError sets SearchJob status failed with errorMessage
  - [ ] progressPct calculated as scrapedCount / totalExpected * 100
- Integration tests:
  - [ ] Mock MapsScraper returning 5 businesses creates 5 Lead rows and 5 analyze jobs
  - [ ] SSE publisher called with lead_scraped for each persisted lead
  - [ ] SearchJob marked completed with totalFound=5 after successful run
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Worker process starts and consumes search queue jobs
- End-to-end: enqueue search job → leads in DB → analyze jobs enqueued

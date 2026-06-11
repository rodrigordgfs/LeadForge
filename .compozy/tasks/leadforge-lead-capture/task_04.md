---
status: completed
title: Shared types and Zod schemas
type: backend
complexity: medium
dependencies:
  - task_03
---

# Task 04: Shared types and Zod schemas

## Overview

Create `packages/shared` with core domain TypeScript types and Zod validation schemas used across API routes, workers, and UI. This package centralizes contracts referenced in TechSpec Core Interfaces without duplicating interface bodies in task files.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST define TypeScript interfaces for MapsScraper, SiteAuditor, and job payloads per TechSpec Core Interfaces
- MUST add Zod schemas for CreateSearchInput, SearchFilters, UserSettings, and SSE event payloads
- MUST validate environment variables with Zod (DATABASE_URL, REDIS_URL, API keys)
- MUST export all types and schemas from package entry point
- MUST reject invalid Brazilian UF codes and radiusKm outside 1–50 range
</requirements>

## Subtasks

- [x] 4.1 Create scraper types (`ScrapeSearchInput`, `ScrapedBusiness`, `MapsScraper`)
- [x] 4.2 Create audit types (`SiteAuditResult`, `SiteAuditor`, `SocialSignals`)
- [x] 4.3 Create Zod schemas for search API request/response bodies
- [x] 4.4 Create env validation schema with safe parse helper
- [x] 4.5 Define SSE event type union and payload schemas
- [x] 4.6 Export public API from `packages/shared/src/index.ts`

## Implementation Details

See TechSpec **Core Interfaces** and **API Endpoints** sections for type contracts. Do not implement business logic here — only types and validation.

### Relevant Files

- `packages/shared/src/scraper/types.ts`
- `packages/shared/src/audit/types.ts`
- `packages/shared/src/schemas/search.ts`
- `packages/shared/src/schemas/env.ts`
- `packages/shared/src/events/sse.ts`
- `packages/shared/src/index.ts`

### Dependent Files

- `packages/db` — enum values should align with Prisma schema

### Related ADRs

- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md) — shared types across apps

## Deliverables

- `@leadforge/shared` package with types and Zod schemas
- Env validation helper used by web and worker apps
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for schema round-trip serialization **(REQUIRED)**

## Tests

- Unit tests:
  - [x] CreateSearchSchema rejects radiusKm=0 with descriptive Zod error
  - [x] CreateSearchSchema rejects invalid UF code "XX"
  - [x] CreateSearchSchema accepts valid payload with optional filters
  - [x] EnvSchema fails when OPENAI_API_KEY missing in production mode
  - [x] SSE event schema validates `lead_analyzed` payload shape
- Integration tests:
  - [x] ScrapedBusiness type serializes to JSON and parses back without data loss
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All TechSpec Core Interface types exported from `@leadforge/shared`
- Zod schemas used by at least one consuming package import without errors

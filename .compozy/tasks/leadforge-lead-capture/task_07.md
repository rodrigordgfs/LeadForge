---
status: pending
title: BullMQ queue package
type: backend
complexity: medium
dependencies:
  - task_01
  - task_02
  - task_04
---

# Task 07: BullMQ queue package

## Overview

Create `packages/queue` with BullMQ queue definitions, job type enums, payload types, and Redis connection factory for the three primary queues: `search`, `analyze`, and `artifacts`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST define queues: `search`, `analyze`, `artifacts` per TechSpec System Architecture
- MUST define typed job payloads: SearchJobPayload, AnalyzeJobPayload, ArtifactsJobPayload
- MUST export queue factory using REDIS_URL from env validation
- MUST configure default job options: 3 attempts, exponential backoff
- MUST export helper to enqueue jobs with typed payloads
- MUST configure concurrency constants: SCRAPER_CONCURRENCY=2 from TechSpec env vars
</requirements>

## Subtasks

- [ ] 7.1 Create Redis connection module with env validation
- [ ] 7.2 Define queue instances and job name constants
- [ ] 7.3 Define typed payload interfaces for each queue
- [ ] 7.4 Export enqueue helpers for web app usage
- [ ] 7.5 Add queue event types for worker registration
- [ ] 7.6 Export public API from `@leadforge/queue`

## Implementation Details

See TechSpec **System Architecture** data flow and **Integration Points** Redis usage. SSE pub/sub channel naming should be consistent with task_10.

### Relevant Files

- `packages/queue/src/connection.ts`
- `packages/queue/src/queues/search.ts`
- `packages/queue/src/queues/analyze.ts`
- `packages/queue/src/queues/artifacts.ts`
- `packages/queue/src/types.ts`
- `packages/queue/src/index.ts`

### Dependent Files

- `packages/shared/src/schemas/env.ts` — REDIS_URL validation
- `docker-compose.yml` — Redis service

### Related ADRs

- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md) — Queue architecture decision

## Deliverables

- `@leadforge/queue` package with typed BullMQ queues
- Enqueue helpers for all three job types
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests enqueueing to Redis **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] SearchJobPayload schema rejects missing searchJobId
  - [ ] AnalyzeJobPayload requires leadId and userId fields
  - [ ] Queue factory throws when REDIS_URL is invalid
  - [ ] Default job options include attempts=3
- Integration tests:
  - [ ] Enqueue search job to Redis and retrieve job by ID
  - [ ] Enqueue analyze job after search job without payload corruption
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All three queues connect to Docker Redis
- Typed enqueue functions exported and importable from web and worker apps

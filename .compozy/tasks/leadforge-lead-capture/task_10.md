---
status: pending
title: SSE job events endpoint
type: backend
complexity: medium
dependencies:
  - task_07
  - task_09
---

# Task 10: SSE job events endpoint

## Overview

Implement Server-Sent Events endpoint for real-time search job progress. Workers publish events via Redis pub/sub; the web app streams them to authenticated clients subscribed to a specific job.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement GET /api/jobs/:id/events as text/event-stream
- MUST support SSE event types: progress, lead_scraped, lead_analyzed, artifact_ready, job_completed, job_failed
- MUST verify job ownership before opening SSE stream
- MUST publish events from workers via Redis pub/sub channel `job:{searchJobId}`
- MUST close stream on job_completed or job_failed events
- MUST include progressPct in progress events (0–100)
</requirements>

## Subtasks

- [ ] 10.1 Create SSE route handler with ReadableStream response
- [ ] 10.2 Implement Redis pub/sub subscriber for job channels
- [ ] 10.3 Create shared event publisher utility for workers
- [ ] 10.4 Add job ownership authorization before streaming
- [ ] 10.5 Handle client disconnect cleanup
- [ ] 10.6 Document event payload shapes in shared package (task_04 extension if needed)

## Implementation Details

See TechSpec **API Endpoints** SSE row and event types list. Publisher lives in `packages/shared` or `packages/queue` for worker reuse.

### Relevant Files

- `apps/web/app/api/jobs/[id]/events/route.ts`
- `packages/shared/src/events/publisher.ts`
- `packages/shared/src/events/sse.ts`

### Dependent Files

- `task_09` — job ID and ownership model
- `docker-compose.yml` — Redis for pub/sub

### Related ADRs

- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md) — SSE over polling decision from TechSpec

## Deliverables

- SSE endpoint streaming job events to authenticated clients
- Shared event publisher for worker integration
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for publish-subscribe round trip **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] SSE route returns Content-Type text/event-stream
  - [ ] Unauthorized request to /api/jobs/:id/events returns 401
  - [ ] Request for another user's job returns 404
  - [ ] Event publisher serializes progress event with progressPct field
- Integration tests:
  - [ ] Publish progress event on Redis channel yields SSE data line in subscriber test
  - [ ] job_completed event closes SSE stream in integration harness
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Client receives progress events within 1s of worker publish in integration test
- Stream closes cleanly on terminal events

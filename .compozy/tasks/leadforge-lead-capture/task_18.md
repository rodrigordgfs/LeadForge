---
status: pending
title: Artifacts worker processor
type: backend
complexity: medium
dependencies:
  - task_15
  - task_17
---

# Task 18: Artifacts worker processor

## Overview

Wire the artifacts BullMQ processor that orchestrates text generation, PDF rendering, base64 storage, and SSE artifact_ready events. Register processor in worker app and add worker Dockerfile to docker-compose.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST register artifacts queue processor in worker app alongside search and analyze
- MUST orchestrate: text generation (task_16) → PDF render + storage (task_17)
- MUST complete within 5 minute job timeout per PRD SLA
- MUST publish SSE artifact_ready event per artifact stored
- MUST publish job_completed on successful full pipeline
- MUST handle partial failure with job_failed event and error logging
- MUST add worker service to docker-compose using Playwright base image
- MUST register all three processors in worker entrypoint
</requirements>

## Subtasks

- [ ] 18.1 Implement artifacts processor handler orchestrating generation pipeline
- [ ] 18.2 Register artifacts processor in worker bootstrap
- [ ] 18.3 Publish artifact_ready SSE events for each stored artifact
- [ ] 18.4 Add 5 minute job timeout configuration
- [ ] 18.5 Create worker Dockerfile with Playwright base image
- [ ] 18.6 Add worker service to docker-compose.yml

## Implementation Details

See TechSpec **Artifact Pipeline Design** and **Deployment Topology**. Worker container uses `mcr.microsoft.com/playwright:v1.49.0-jammy`.

### Relevant Files

- `apps/worker/src/processors/artifacts-processor.ts`
- `apps/worker/src/index.ts` — register all processors
- `apps/worker/Dockerfile`
- `docker-compose.yml` — add worker service

### Dependent Files

- `task_16` — text generator
- `task_17` — artifact storage
- `task_10` — SSE publisher

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — Artifacts triggered by analyze processor
- [ADR-005: Artifact Storage as Base64 in PostgreSQL](../adrs/adr-005.md)

## Deliverables

- Artifacts queue processor fully wired
- Worker Docker image and compose service
- All three BullMQ processors registered in worker app
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for full artifact pipeline with mocks **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Artifacts processor calls text generator then storage in correct order
  - [ ] Partial failure after 3 of 6 artifacts publishes job_failed not job_completed
  - [ ] artifact_ready SSE event published with artifact type and leadId
  - [ ] Job timeout at 5 minutes aborts long-running OpenAI call
- Integration tests:
  - [ ] Mock text generator + real storage creates 6 Artifact rows for lead
  - [ ] Worker docker-compose service starts and connects to Redis and PostgreSQL
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Worker container runs all three queue processors
- Full artifact pipeline completes within integration test harness

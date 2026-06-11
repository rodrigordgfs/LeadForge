---
status: completed
title: Docker Compose PostgreSQL + Redis
type: infra
complexity: low
dependencies:
  - task_01
---

# Task 02: Docker Compose PostgreSQL + Redis

## Overview

Provide local development infrastructure with PostgreSQL and Redis via Docker Compose. These services are required before Prisma migrations and BullMQ job processing can run.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add `docker-compose.yml` with PostgreSQL 16 and Redis 7 services
- MUST expose PostgreSQL on port 5432 and Redis on port 6379 for local dev
- MUST configure named volumes for data persistence
- MUST document startup commands in root README section or compose comments
- MUST align `DATABASE_URL` and `REDIS_URL` defaults with `.env.example`
</requirements>

## Subtasks

- [x] 2.1 Create `docker-compose.yml` with postgres and redis services
- [x] 2.2 Add healthcheck definitions for both services
- [x] 2.3 Configure default credentials suitable for local development only
- [x] 2.4 Update `.env.example` with compose-aligned connection strings
- [x] 2.5 Verify services start and accept connections

## Implementation Details

Follow TechSpec **Development Sequencing** step 2. Web and worker containers are added in later tasks; this task covers data layer only.

### Relevant Files

- `docker-compose.yml` — postgres + redis services
- `.env.example` — connection string defaults
- `package.json` — add `docker:up` and `docker:down` scripts

### Dependent Files

- `task_01` outputs — monorepo root must exist

### Related ADRs

- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md) — Redis required for BullMQ

## Deliverables

- Runnable Docker Compose stack for PostgreSQL and Redis
- npm scripts for compose lifecycle
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests verifying DB and Redis connectivity **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Compose file defines `postgres` service with port 5432
  - [ ] Compose file defines `redis` service with port 6379
  - [ ] Healthcheck blocks present for both services
- Integration tests:
  - [ ] `docker compose up -d` starts both services successfully
  - [ ] PostgreSQL accepts connection with `DATABASE_URL` from `.env.example`
  - [ ] Redis accepts PING with `REDIS_URL` from `.env.example`
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `docker compose up -d` brings postgres and redis to healthy state
- Connection strings in `.env.example` connect successfully

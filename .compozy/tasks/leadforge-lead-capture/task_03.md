---
status: completed
title: Prisma schema and migrations
type: backend
complexity: high
dependencies:
  - task_01
  - task_02
---

# Task 03: Prisma schema and migrations

## Overview

Implement the full PostgreSQL data model in `packages/db` using Prisma, covering all entities from the TechSpec Data Models section. This schema is the persistence foundation for leads, jobs, CRM, artifacts, and user settings.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement all TechSpec entities: User, SearchJob, Lead, Contact, Proposal, Artifact, Prompt
- MUST define enums for SearchJobStatus, LeadStatus, ArtifactType, and scoreBand values
- MUST add indexes specified in TechSpec Data Models section
- MUST configure `contentBase64` as `@db.Text` on Artifact with cascade delete from Lead
- MUST export typed Prisma client from `packages/db`
- MUST generate and apply initial migration against Docker PostgreSQL
- MUST seed script stub for development (optional single test user)
</requirements>

## Subtasks

- [x] 3.1 Create `packages/db/prisma/schema.prisma` with all models and relations
- [x] 3.2 Define enums matching PRD CRM statuses and TechSpec job statuses
- [x] 3.3 Add indexes on Lead(userId, status), Lead(searchJobId), Artifact(leadId, type)
- [x] 3.4 Generate initial migration and verify against Docker postgres
- [x] 3.5 Export `prisma` client singleton from `packages/db/src/index.ts`
- [x] 3.6 Add Prisma scripts to root turbo pipeline

## Implementation Details

See TechSpec **Data Models** section for field-level schema. User.id uses Clerk user ID as primary key. Lead fields extend init.md with whatsapp, instagram, diagnosisJson, autoPipelineTriggered.

### Relevant Files

- `packages/db/prisma/schema.prisma` — full schema
- `packages/db/prisma/migrations/` — initial migration
- `packages/db/src/index.ts` — client export
- `packages/db/package.json` — prisma scripts

### Dependent Files

- `docker-compose.yml` — PostgreSQL must be running for migration
- `.env.example` — DATABASE_URL

### Related ADRs

- [ADR-005: Artifact Storage as Base64 in PostgreSQL](../adrs/adr-005.md) — Artifact.contentBase64 field design

## Deliverables

- Complete Prisma schema with initial migration applied
- Exported `@leadforge/db` package with typed client
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with Testcontainers or Docker postgres **(REQUIRED)**

## Tests

- Unit tests:
  - [x] Schema defines LeadStatus enum with all 7 PRD CRM values
  - [x] Schema defines ArtifactType enum with all 6 artifact types
  - [x] Lead model has required indexes in schema metadata
- Integration tests:
  - [x] Migration applies cleanly on fresh PostgreSQL
  - [x] Create User → SearchJob → Lead → Artifact cascade works
  - [x] Delete Lead cascades to Contact, Proposal, Artifact, Prompt records
  - [x] Insert Artifact with 5MB base64 boundary rejected or validated at app layer
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `pnpm --filter @leadforge/db migrate:dev` succeeds
- All TechSpec entities queryable via Prisma client

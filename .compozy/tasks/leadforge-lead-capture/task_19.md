---
status: pending
title: Lead and CRM status API
type: backend
complexity: medium
dependencies:
  - task_03
  - task_08
---

# Task 19: Lead and CRM status API

## Overview

Implement lead detail and CRM status management API endpoints. Users can view full lead data and transition leads through the PRD CRM status pipeline.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement GET /api/leads/:id returning lead detail with diagnosisJson summary
- MUST implement PATCH /api/leads/:id for CRM status transitions
- MUST validate status against LeadStatus enum (7 PRD values)
- MUST enforce valid status transition rules (no skip from Novo to Fechado without intermediate)
- MUST scope all queries to authenticated userId
- MUST include artifact metadata list (type, filename, size) without base64 in detail response
- MUST implement GET /api/dashboard returning aggregated stats
</requirements>

## Subtasks

- [ ] 19.1 Implement GET /api/leads/:id with diagnosis and artifact metadata
- [ ] 19.2 Implement PATCH /api/leads/:id status update with validation
- [ ] 19.3 Define CRM status transition state machine
- [ ] 19.4 Implement GET /api/dashboard with lead counts by status
- [ ] 19.5 Add authorization checks preventing cross-user lead access

## Implementation Details

See TechSpec **API Endpoints** for leads and dashboard rows. CRM statuses from PRD: Novo, Em Contato, Interessado, Proposta Enviada, Negociação, Fechado, Perdido.

### Relevant Files

- `apps/web/app/api/leads/[id]/route.ts`
- `apps/web/app/api/dashboard/route.ts`
- `apps/web/lib/crm/status-transitions.ts`

### Dependent Files

- `packages/db` — Lead, Artifact models
- `task_08` — auth middleware

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — Lead autoPipelineTriggered field exposed in detail

## Deliverables

- Lead detail and status update API endpoints
- Dashboard stats endpoint
- CRM status transition validation
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for status flow **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] PATCH status Novo → Em Contato succeeds
  - [ ] PATCH status Novo → Fechado returns 400 invalid transition
  - [ ] GET /api/leads/:id for another user returns 404
  - [ ] GET /api/dashboard returns counts grouped by status
  - [ ] Lead detail includes score, scoreBand, problems from diagnosisJson
- Integration tests:
  - [ ] Full CRM flow Novo → Em Contato → Interessado → Proposta Enviada in database
  - [ ] Dashboard counts update after status change
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All 7 CRM statuses supported with valid transitions enforced
- Dashboard returns accurate lead counts per status

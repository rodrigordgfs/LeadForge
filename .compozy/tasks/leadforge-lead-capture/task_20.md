---
status: pending
title: Contacts, settings, proposals, and download API
type: backend
complexity: medium
dependencies:
  - task_19
---

# Task 20: Contacts, settings, proposals, and download API

## Overview

Implement remaining backend API endpoints for CRM contacts, user settings, proposal management, manual pipeline triggers, and artifact file downloads.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement POST/GET /api/leads/:id/contacts for CRM contact log
- MUST implement GET/PATCH /api/settings for user settings (threshold, proposal defaults)
- MUST implement POST /api/leads/:id/analyze for manual re-diagnosis enqueue
- MUST implement POST /api/leads/:id/artifacts for manual artifact pipeline enqueue
- MUST implement GET /api/leads/:id/artifacts/:type decoding base64 to binary response
- MUST set correct Content-Type and Content-Disposition headers on artifact download
- MUST reject re-diagnosis for leads diagnosed within last 24 hours unless force flag set
</requirements>

## Subtasks

- [ ] 20.1 Implement contacts CRUD endpoints
- [ ] 20.2 Implement settings GET/PATCH endpoints
- [ ] 20.3 Implement manual analyze and artifacts trigger endpoints
- [ ] 20.4 Implement artifact download with base64 decode
- [ ] 20.5 Add LGPD lead deletion endpoint (DELETE /api/leads/:id) cascading artifacts
- [ ] 20.6 Validate settings PATCH with Zod schema

## Implementation Details

See TechSpec **API Endpoints** remaining rows and PRD Settings module. Manual triggers bypass ADR-001 auto criteria — always enqueue on user request.

### Relevant Files

- `apps/web/app/api/leads/[id]/contacts/route.ts`
- `apps/web/app/api/leads/[id]/analyze/route.ts`
- `apps/web/app/api/leads/[id]/artifacts/route.ts`
- `apps/web/app/api/leads/[id]/artifacts/[type]/route.ts`
- `apps/web/app/api/settings/route.ts`
- `apps/web/lib/settings/schema.ts`

### Dependent Files

- `task_19` — lead authorization
- `packages/queue` — analyze and artifacts enqueue
- `packages/db` — Contact, Artifact, User models

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — Manual trigger override
- [ADR-005: Artifact Storage as Base64 in PostgreSQL](../adrs/adr-005.md) — Download decode

## Deliverables

- Contacts, settings, manual trigger, and download API endpoints
- LGPD-compliant lead deletion
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for download and manual triggers **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] POST contact with missing notes returns 400
  - [ ] PATCH settings with threshold=150 returns 400 (max 100)
  - [ ] GET artifact download returns application/pdf for proposal_pdf type
  - [ ] GET artifact download for missing type returns 404
  - [ ] POST /api/leads/:id/artifacts enqueues artifacts job regardless of score
  - [ ] DELETE /api/leads/:id removes lead and cascaded artifacts
- Integration tests:
  - [ ] Download endpoint returns bytes matching stored base64 content
  - [ ] Manual analyze trigger enqueues analyze job for lead
  - [ ] Settings PATCH persists highOpportunityThreshold to User.settingsJson
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All remaining TechSpec API endpoints implemented
- Artifact download serves correct binary content and headers

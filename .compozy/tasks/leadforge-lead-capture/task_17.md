---
status: pending
title: PDF templates and base64 storage
type: backend
complexity: medium
dependencies:
  - task_16
---

# Task 17: PDF templates and base64 storage

## Overview

Render PDF documents from generated text artifacts using @react-pdf/renderer and persist all artifacts (TXTs and PDFs) as base64 in the PostgreSQL artifacts table per ADR-005.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST render proposal_pdf, diagnosis_pdf, wireframe_pdf using @react-pdf/renderer templates
- MUST store TXT artifacts: company_txt, analysis_txt, website_brief_txt as base64 in artifacts table
- MUST enforce 5 MB raw size cap per artifact before insert
- MUST set correct mimeType and filename per artifact type
- MUST create/update Proposal record from generated proposal fields
- MUST encode file content as base64 string in contentBase64 column
</requirements>

## Subtasks

- [ ] 17.1 Create PDF templates for proposal, diagnosis, and wireframe
- [ ] 17.2 Implement artifact persistence service with base64 encoding
- [ ] 17.3 Implement 5 MB size validation before storage
- [ ] 17.4 Upsert Proposal record linked to lead
- [ ] 17.5 Store all 6 artifact types for a complete pipeline run
- [ ] 17.6 Export artifact storage service for worker use

## Implementation Details

See TechSpec **Artifact Pipeline Design** steps 3–5 and ADR-005. PDF generation does not use headless browser — @react-pdf/renderer only.

### Relevant Files

- `apps/worker/src/artifacts/pdf/proposal-template.tsx`
- `apps/worker/src/artifacts/pdf/diagnosis-template.tsx`
- `apps/worker/src/artifacts/pdf/wireframe-template.tsx`
- `apps/worker/src/artifacts/artifact-storage.ts`

### Dependent Files

- `task_16` — text content inputs for PDF rendering
- `packages/db` — Artifact, Proposal models

### Related ADRs

- [ADR-005: Artifact Storage as Base64 in PostgreSQL](../adrs/adr-005.md) — Storage format and size cap

## Deliverables

- Three PDF templates rendered from generated content
- Artifact storage service with base64 persistence
- Proposal record creation
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests storing and retrieving artifacts **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] PDF renderer produces non-empty buffer for fixture proposal data
  - [ ] Artifact storage rejects content exceeding 5 MB with ArtifactTooLargeError
  - [ ] Base64 encoding round-trip preserves exact file bytes
  - [ ] company_txt stored with mimeType text/plain and .txt filename
- Integration tests:
  - [ ] Store all 6 artifact types for one lead in test database
  - [ ] Proposal record created with value and scope from generated content
  - [ ] Duplicate artifact type for same lead upserts or replaces per design
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All 6 PRD artifact types persistable as base64
- 5 MB cap enforced before database insert

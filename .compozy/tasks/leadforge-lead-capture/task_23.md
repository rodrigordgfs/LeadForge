---
status: pending
title: Lead detail UI
type: frontend
complexity: medium
dependencies:
  - task_18
  - task_19
  - task_20
  - task_22
---

# Task 23: Lead detail UI

## Overview

Build the lead detail page showing full contact info, digital diagnosis, score breakdown, generated artifacts with download links, and manual pipeline trigger buttons.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST display lead contact info with one-click WhatsApp and phone actions
- MUST show diagnosis problems and opportunities lists from diagnosisJson
- MUST show score breakdown with band label and visual gauge
- MUST list available artifacts with download buttons calling GET /api/leads/:id/artifacts/:type
- MUST show wireframe preview (textual structure) when wireframe artifact exists
- MUST provide "Gerar diagnóstico" button calling POST /api/leads/:id/analyze
- MUST provide "Gerar pacote completo" button calling POST /api/leads/:id/artifacts
- MUST show CRM status selector updating via PATCH /api/leads/:id
- MUST show loading state while artifacts generate with SSE artifact_ready updates
</requirements>

## Subtasks

- [ ] 23.1 Create lead detail page at /leads/[id]
- [ ] 23.2 Build contact info and quick-action section
- [ ] 23.3 Build diagnosis panel with problems and opportunities
- [ ] 23.4 Build score gauge and breakdown component
- [ ] 23.5 Build artifacts list with download links
- [ ] 23.6 Add manual trigger buttons and CRM status selector
- [ ] 23.7 Subscribe to SSE for artifact_ready events on this lead

## Implementation Details

See PRD **User Experience** steps 4–6 and TechSpec lead detail API. Wireframe preview renders structured JSON from diagnosis or wireframe artifact.

### Relevant Files

- `apps/web/app/(app)/leads/[id]/page.tsx`
- `apps/web/components/leads/lead-detail.tsx`
- `apps/web/components/leads/diagnosis-panel.tsx`
- `apps/web/components/leads/artifact-list.tsx`
- `apps/web/components/leads/score-gauge.tsx`

### Dependent Files

- `task_19` — lead detail and status API
- `task_20` — download and manual trigger API
- `task_22` — navigation from results list

### Related ADRs

- [ADR-005: Artifact Storage as Base64 in PostgreSQL](../adrs/adr-005.md) — Download flow
- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — Manual trigger buttons

## Deliverables

- Lead detail page with full diagnosis and artifact management
- Manual pipeline trigger buttons
- CRM status selector on detail page
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for download and trigger actions **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] DiagnosisPanel renders problems list from fixture diagnosisJson
  - [ ] ArtifactList shows download button for each available artifact type
  - [ ] Manual trigger button calls POST /api/leads/:id/artifacts on click
  - [ ] CRM status select calls PATCH /api/leads/:id with new status
  - [ ] ScoreGauge displays "Crítico" label for score 30
- Integration tests:
  - [ ] Lead detail page loads data from GET /api/leads/:id on mount
  - [ ] artifact_ready SSE event adds new download button without page reload
  - [ ] Download link triggers GET /api/leads/:id/artifacts/proposal_pdf
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- User can view diagnosis, download artifacts, and trigger manual pipeline from detail page
- CRM status updatable from detail page

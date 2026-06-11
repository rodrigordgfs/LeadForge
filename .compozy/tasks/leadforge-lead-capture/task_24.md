---
status: pending
title: CRM kanban, contact log, dashboard, and settings UI
type: frontend
complexity: high
dependencies:
  - task_15
  - task_18
  - task_20
  - task_22
  - task_23
---

# Task 24: CRM kanban, contact log, dashboard, and settings UI

## Overview

Build the remaining MVP UI screens: CRM kanban pipeline, contact log per lead, dashboard overview, and settings page with high-opportunity threshold configuration. Completes the user-facing product loop from PRD modules.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST build CRM kanban at /crm with columns for all 7 PRD statuses
- MUST support drag-and-drop status transitions calling PATCH /api/leads/:id
- MUST build contact log component on lead detail showing POST/GET /api/leads/:id/contacts
- MUST build dashboard at /dashboard showing total leads, by-status counts, recent searches, high-opportunity count
- MUST build settings page at /configuracoes with highOpportunityThreshold slider (default 60)
- MUST persist settings via PATCH /api/settings
- MUST add main navigation linking Busca, CRM, Dashboard, Configurações
- MUST be mobile-responsive for field prospecting per PRD UX principles
</requirements>

## Subtasks

- [ ] 24.1 Build CRM kanban board with 7 status columns
- [ ] 24.2 Implement drag-and-drop status update with API sync
- [ ] 24.3 Build contact log form and history list on lead detail
- [ ] 24.4 Build dashboard page with stats from GET /api/dashboard
- [ ] 24.5 Build settings page with threshold and proposal default fields
- [ ] 24.6 Add app navigation shell linking all main sections
- [ ] 24.7 Verify mobile-responsive layout on all four screens

## Implementation Details

See PRD **CRM**, **Dashboard**, and **Settings** modules. Kanban loads all user leads grouped by status. Dashboard high-opportunity count uses score ≤ threshold from user settings.

### Relevant Files

- `apps/web/app/(app)/crm/page.tsx`
- `apps/web/app/(app)/dashboard/page.tsx`
- `apps/web/app/(app)/configuracoes/page.tsx`
- `apps/web/components/crm/kanban-board.tsx`
- `apps/web/components/crm/contact-log.tsx`
- `apps/web/components/layout/app-nav.tsx`

### Dependent Files

- `task_19` — dashboard and status API
- `task_20` — contacts and settings API
- `task_23` — lead detail page hosts contact log
- `task_22` — lead list navigation

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — Threshold setting in UI
- [ADR-002: Brazil-First Market with Fixed Segment Catalog](../adrs/adr-002.md) — Portuguese UI

## Deliverables

- CRM kanban with drag-and-drop
- Contact log component integrated in lead detail
- Dashboard and settings pages
- App navigation shell
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for kanban and settings flows **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] KanbanBoard renders 7 columns with correct PRD status labels
  - [ ] Drag lead from Novo to Em Contato calls PATCH with status Em Contato
  - [ ] ContactLog form submit calls POST /api/leads/:id/contacts with notes
  - [ ] Dashboard displays highOpportunityCount from API response
  - [ ] Settings slider default value 60 on first load
  - [ ] Settings save calls PATCH /api/settings with new threshold
- Integration tests:
  - [ ] Kanban drag updates lead status in database via API
  - [ ] Settings threshold change affects isHighOpportunity for new analyze jobs (via settings API round-trip)
  - [ ] Dashboard loads stats on mount from GET /api/dashboard
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All PRD modules (CRM, Dashboard, Settings) accessible from navigation
- Full user loop completable: search → results → detail → CRM → dashboard
- Mobile-responsive layout verified at 375px viewport width

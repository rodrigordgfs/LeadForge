---
status: pending
title: Search results list UI
type: frontend
complexity: medium
dependencies:
  - task_21
---

# Task 22: Search results list UI

## Overview

Build the search results list showing discovered leads sorted by opportunity score, with website status badges, WhatsApp indicators, and navigation to lead detail pages.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST display paginated lead list from GET /api/searches/:id/leads
- MUST sort by score ascending (lowest opportunity first) per PRD UX
- MUST show score badge with color coding per band (critical/low/medium/excellent)
- MUST show website status (sem site / site fraco / site ok) per lead
- MUST show WhatsApp indicator and one-click wa.me link when phone available
- MUST show autoPipelineTriggered badge for leads being processed
- MUST poll or SSE-update list as new leads are analyzed during active search
- MUST link each row to /leads/:id detail page
</requirements>

## Subtasks

- [ ] 22.1 Create results page at /busca/[searchId]
- [ ] 22.2 Build lead list table/card component with score badges
- [ ] 22.3 Implement pagination controls
- [ ] 22.4 Add WhatsApp and phone quick-action buttons
- [ ] 22.5 Refresh list on lead_analyzed SSE events during active job
- [ ] 22.6 Add empty state and loading skeleton

## Implementation Details

See PRD **User Experience** step 2 and TechSpec UX principles. Results page receives searchJobId from task_21 redirect.

### Relevant Files

- `apps/web/app/(app)/busca/[searchId]/page.tsx`
- `apps/web/components/leads/lead-list.tsx`
- `apps/web/components/leads/score-badge.tsx`
- `apps/web/components/leads/website-status.tsx`

### Dependent Files

- `task_21` — search flow and SSE hook
- `task_09` — GET /api/searches/:id/leads

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — autoPipelineTriggered badge

## Deliverables

- Search results list page with pagination
- Score and website status badge components
- Live list updates during active search job
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with mock lead data **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] ScoreBadge renders red for score 35 (critical band)
  - [ ] ScoreBadge renders green for score 85 (excellent band)
  - [ ] WebsiteStatus shows "Sem site" when hasRealWebsite=false
  - [ ] LeadList renders WhatsApp button only when whatsapp field present
  - [ ] Pagination requests page 2 with correct offset parameter
- Integration tests:
  - [ ] Results page fetches leads on mount with searchJobId param
  - [ ] lead_analyzed SSE event triggers list refetch in integration harness
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Results list displays leads sorted by score ascending
- Score badges and website status visible on every row

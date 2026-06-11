---
status: pending
title: Analyze worker and auto-pipeline trigger
type: backend
complexity: high
dependencies:
  - task_06
  - task_12
  - task_14
---

# Task 15: Analyze worker and auto-pipeline trigger

## Overview

Implement the analyze BullMQ processor that runs hybrid site audit, calculates digital score, persists diagnosis, and conditionally enqueues the artifacts pipeline for high-opportunity leads per ADR-001.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST register analyze queue processor in worker app
- MUST run HybridSiteAuditor on lead website URL (skip audit if no URL)
- MUST calculate score using calculateDigitalScore from task_06
- MUST persist score, scoreBand, hasRealWebsite, diagnosisJson, diagnosedAt on Lead
- MUST read user highOpportunityThreshold from settingsJson (default 60)
- MUST enqueue artifacts job when isHighOpportunity returns true
- MUST set autoPipelineTriggered=true when artifacts job enqueued automatically
- MUST publish SSE lead_analyzed event with score and autoPipelineTriggered flag
</requirements>

## Subtasks

- [ ] 15.1 Implement analyze processor handler
- [ ] 15.2 Integrate HybridSiteAuditor and score calculator
- [ ] 15.3 Persist audit results and score on Lead record
- [ ] 15.4 Implement auto-pipeline trigger using isHighOpportunity
- [ ] 15.5 Enqueue artifacts job for high-opportunity leads
- [ ] 15.6 Publish lead_analyzed SSE events

## Implementation Details

See TechSpec data flow step 3 and ADR-001 implementation notes. Analyze jobs are enqueued per lead by search processor (task_12).

### Relevant Files

- `apps/worker/src/processors/analyze-processor.ts`
- `apps/worker/src/services/score-lead.ts`
- `apps/worker/src/services/pipeline-trigger.ts`

### Dependent Files

- `task_14` — HybridSiteAuditor
- `task_06` — score calculator
- `packages/queue` — artifacts queue enqueue
- `packages/db` — Lead model update

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — Auto-trigger criteria
- [ADR-006: Hybrid Site Audit](../adrs/adr-006.md) — Audit inputs to scoring

## Deliverables

- Analyze queue processor with scoring and auto-trigger
- Lead diagnosis persistence
- Conditional artifacts job enqueue
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for high vs low opportunity paths **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Lead with no website gets score ≤ 40 and autoPipelineTriggered=true
  - [ ] Lead with score 55 and hasRealWebsite=true triggers artifacts job
  - [ ] Lead with score 75 and hasRealWebsite=true does NOT auto-trigger artifacts
  - [ ] User threshold 50 triggers artifacts for score 55 (custom threshold)
  - [ ] lead_analyzed SSE event includes score and autoPipelineTriggered fields
- Integration tests:
  - [ ] Analyze processor with mock auditor updates Lead row in database
  - [ ] High-opportunity lead enqueues exactly one artifacts job
  - [ ] Low-opportunity lead does not enqueue artifacts job
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Score and diagnosis persisted on every analyzed lead
- ADR-001 auto-pipeline rules correctly applied

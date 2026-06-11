---
status: pending
title: Score calculator and isHighOpportunity
type: backend
complexity: medium
dependencies:
  - task_04
---

# Task 06: Score calculator and isHighOpportunity

## Overview

Implement the digital maturity score calculator (0–100) and high-opportunity detection logic in `packages/shared`. These pure functions drive lead prioritization and automatic artifact pipeline triggering per ADR-001.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `calculateDigitalScore(input: ScoreInput): number` per TechSpec Core Interfaces
- MUST implement `isHighOpportunity(score, hasRealWebsite, threshold?)` with default threshold 60
- MUST map score to bands: 0–40 critical, 41–60 low, 61–80 medium, 81–100 excellent
- MUST apply TechSpec weighting: website 30%, SSL 10%, mobile 15%, PSI 20%, SEO 15%, social/GBP 10%
- MUST return score ≤ 40 for leads with no real website
- MUST treat social-only URLs (facebook.com, instagram.com) as no real website input
</requirements>

## Subtasks

- [ ] 6.1 Implement score band mapper function
- [ ] 6.2 Implement weighted score calculation from ScoreInput
- [ ] 6.3 Implement isHighOpportunity with configurable threshold
- [ ] 6.4 Handle null audit (no website) case with maximum penalty
- [ ] 6.5 Export score utilities from shared package

## Implementation Details

See TechSpec **Core Interfaces** scoring section and ADR-006 weighting. Pure functions with no I/O — fully unit testable.

### Relevant Files

- `packages/shared/src/scoring/score-calculator.ts`
- `packages/shared/src/scoring/score-bands.ts`
- `packages/shared/src/scoring/types.ts`

### Dependent Files

- `packages/shared/src/audit/types.ts` — SiteAuditResult input shape

### Related ADRs

- [ADR-001: Smart Prospecting Pipeline Approach](../adrs/adr-001.md) — isHighOpportunity threshold logic
- [ADR-006: Hybrid Site Audit](../adrs/adr-006.md) — Score weighting inputs

## Deliverables

- Pure score calculator and opportunity detection functions
- Score band mapping utility
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with fixture audit payloads **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] No website + no audit returns score in 0–40 band
  - [ ] Social-only URL treated as hasRealWebsite=false yields score ≤ 40
  - [ ] Full audit with PSI performanceScore=90 returns score in 81–100 band
  - [ ] isHighOpportunity(55, true) returns true with default threshold 60
  - [ ] isHighOpportunity(65, true) returns false with default threshold 60
  - [ ] isHighOpportunity(80, false) returns true regardless of score
  - [ ] Score band mapper returns "low" for score 45
- Integration tests:
  - [ ] End-to-end: fixture SiteAuditResult with PSI data produces expected score within band
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All PRD score bands correctly assigned
- isHighOpportunity matches ADR-001 criteria (no website OR score ≤ threshold)

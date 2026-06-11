---
status: pending
title: PSI API client and audit merge
type: backend
complexity: medium
dependencies:
  - task_13
---

# Task 14: PSI API client and audit merge

## Overview

Implement Google PageSpeed Insights v5 API client and merge PSI metrics into SiteAuditResult. Provides Phase B of the hybrid audit from ADR-006 with graceful fallback when API unavailable.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST call PSI v5 API `/pagespeedonline/v5/runPagespeed` with mobile strategy
- MUST extract performanceScore, LCP, CLS, and SEO category score from response
- MUST merge PSI data into SiteAuditResult.psi field
- MUST fallback to Playwright-only result when PSI fails after 2 retries
- MUST set psi_available=false flag in diagnosisJson when fallback used
- MUST skip PSI call when URL unreachable in Phase A audit
- MUST use GOOGLE_PSI_API_KEY from env validation
</requirements>

## Subtasks

- [ ] 14.1 Implement PSI API client with typed response parsing
- [ ] 14.2 Implement retry logic with 2 attempts and exponential backoff
- [ ] 14.3 Create mergeAuditResults combining Phase A and PSI data
- [ ] 14.4 Add mock PSI client for development and CI
- [ ] 14.5 Track daily PSI call counter for quota monitoring
- [ ] 14.6 Export HybridSiteAuditor wrapping Playwright + PSI

## Implementation Details

See TechSpec **Integration Points** PSI row and ADR-006 Phase B. Export combined auditor used by analyze processor in task_15.

### Relevant Files

- `apps/worker/src/audit/psi-client.ts`
- `apps/worker/src/audit/hybrid-auditor.ts`
- `apps/worker/src/audit/psi-mock.ts`

### Dependent Files

- `task_13` — PlaywrightSiteAuditor Phase A output
- `packages/shared/src/schemas/env.ts` — GOOGLE_PSI_API_KEY

### Related ADRs

- [ADR-006: Hybrid Site Audit](../adrs/adr-006.md) — PSI integration and fallback

## Deliverables

- PSI API client with retry and mock implementation
- HybridSiteAuditor merging Playwright and PSI results
- Daily quota counter utility
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with mock PSI responses **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] PSI client parses performanceScore from mock v5 response JSON
  - [ ] PSI client retries twice then returns null on persistent 500 error
  - [ ] mergeAuditResults adds psi field when PSI data available
  - [ ] mergeAuditResults sets psi_available=false when PSI returns null
  - [ ] HybridSiteAuditor skips PSI when Phase A reports unreachable URL
- Integration tests:
  - [ ] HybridSiteAuditor with mock PSI returns complete SiteAuditResult with psi block
  - [ ] Fallback path produces valid audit without psi field for score calculation
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- PSI metrics merged into SiteAuditResult when API succeeds
- Graceful fallback when PSI unavailable does not fail audit job

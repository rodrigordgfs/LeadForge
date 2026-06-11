---
status: pending
title: Playwright site auditor module
type: backend
complexity: high
dependencies:
  - task_04
  - task_07
---

# Task 13: Playwright site auditor module

## Overview

Implement the Playwright-based site auditor performing SSL checks, viewport responsiveness tests, SEO basics detection, and real-website classification. Implements the SiteAuditor interface Phase A from ADR-006.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement SiteAuditor interface Phase A from TechSpec Core Interfaces
- MUST classify facebook.com, instagram.com, linktree, yelp as NOT real websites
- MUST check SSL validity via HTTPS navigation
- MUST test desktop (1280×720) and mobile (375×667) viewport responsiveness
- MUST detect title, meta description, and h1 presence for SEO basics
- MUST detect own domain vs third-party subdomain patterns
- MUST populate problems and opportunities arrays in SiteAuditResult
- MUST use 15s navigation timeout with graceful partial results on timeout
</requirements>

## Subtasks

- [ ] 13.1 Implement URL normalization and social-only URL classifier
- [ ] 13.2 Implement SSL and redirect chain check
- [ ] 13.3 Implement dual-viewport responsiveness check
- [ ] 13.4 Implement SEO basics DOM inspection
- [ ] 13.5 Build problems/opportunities lists from audit findings
- [ ] 13.6 Export PlaywrightSiteAuditor implementing SiteAuditor interface
- [ ] 13.7 Add fixture HTML tests for known site patterns

## Implementation Details

See TechSpec **Core Interfaces** SiteAuditResult and ADR-006 Phase A. PSI integration is task_14 — this module returns SiteAuditResult without psi field.

### Relevant Files

- `apps/worker/src/audit/playwright-auditor.ts`
- `apps/worker/src/audit/url-classifier.ts`
- `apps/worker/src/audit/seo-checks.ts`
- `apps/worker/fixtures/site-with-ssl.html`
- `apps/worker/fixtures/site-no-viewport.html`

### Dependent Files

- `packages/shared/src/audit/types.ts` — SiteAuditor interface

### Related ADRs

- [ADR-006: Hybrid Site Audit](../adrs/adr-006.md) — Phase A Playwright heuristics

## Deliverables

- PlaywrightSiteAuditor implementing SiteAuditor (Phase A only)
- Social-only URL classifier
- Fixture-based test suite
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with local HTML fixtures **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] URL classifier marks instagram.com/profile as hasRealWebsite=false
  - [ ] URL classifier marks custom domain as hasRealWebsite=true
  - [ ] SEO check detects missing meta description in fixture
  - [ ] Mobile viewport check fails when viewport meta absent in fixture
  - [ ] Navigation timeout returns partial SiteAuditResult with timeout problem
- Integration tests:
  - [ ] Audit local HTTPS fixture returns sslValid=true
  - [ ] Audit fixture without h1 adds "SEO inexistente" to problems
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- SiteAuditor interface implemented for Phase A
- Social-only URLs correctly classified as not real websites

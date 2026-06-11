---
status: completed
title: Next.js shell and Clerk auth
type: backend
complexity: medium
dependencies:
  - task_01
  - task_03
---

# Task 08: Next.js shell and Clerk auth

## Overview

Bootstrap `apps/web` as a Next.js 15 App Router application with Clerk authentication middleware, user sync to PostgreSQL, and a protected app layout. All API routes except health check require authenticated sessions.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST initialize Next.js 15 App Router in `apps/web`
- MUST integrate Clerk middleware protecting all routes except `/api/health` and sign-in pages
- MUST implement Clerk webhook or post-auth hook to upsert User record in PostgreSQL
- MUST add `GET /api/health` returning 200 with service status
- MUST configure default user settingsJson with highOpportunityThreshold: 60
- MUST use Brazilian Portuguese as default locale for UI shell
</requirements>

## Subtasks

- [x] 8.1 Initialize Next.js app with App Router and Tailwind CSS
- [x] 8.2 Configure Clerk provider and middleware
- [x] 8.3 Implement User upsert on first authenticated request or webhook
- [x] 8.4 Create protected `(app)` layout shell with navigation placeholders
- [x] 8.5 Add `GET /api/health` unauthenticated endpoint
- [x] 8.6 Add sign-in and sign-up pages via Clerk components

## Implementation Details

See TechSpec **API Endpoints** auth requirements and **Integration Points** Clerk row. User.id maps to Clerk user ID in Prisma schema.

### Relevant Files

- `apps/web/app/layout.tsx`
- `apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `apps/web/middleware.ts`
- `apps/web/app/api/health/route.ts`
- `apps/web/lib/auth.ts`
- `apps/web/lib/user-sync.ts`

### Dependent Files

- `packages/db` — User model and Prisma client
- `.env.example` — CLERK keys

### Related ADRs

- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md) — Next.js web app layer

## Deliverables

- Running Next.js app with Clerk auth
- User sync to PostgreSQL on authentication
- Health check endpoint
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth middleware and user upsert **(REQUIRED)**

## Tests

- Unit tests:
  - [x] Middleware allows `/api/health` without authentication
  - [x] Middleware blocks `/api/searches` without session
  - [x] user-sync creates User with default settingsJson threshold 60
  - [x] user-sync updates name/email on subsequent login without duplicating
- Integration tests:
  - [x] GET /api/health returns 200 `{ status: 'ok' }`
  - [x] Authenticated mock session upserts User row in test database
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Unauthenticated requests to protected routes return 401
- Authenticated user record exists in PostgreSQL after first login

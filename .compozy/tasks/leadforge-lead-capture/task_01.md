---
status: completed
title: Monorepo scaffold
type: infra
complexity: medium
dependencies: []
---

# Task 01: Monorepo scaffold

## Overview

Bootstrap the LeadForge monorepo with pnpm workspaces, Turborepo, shared TypeScript and ESLint configuration, and the directory layout defined in the TechSpec. This task establishes the foundation every subsequent package and app depends on.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create pnpm workspace root with `apps/*` and `packages/*` globs
- MUST configure Turborepo pipeline tasks for `build`, `lint`, `test`, and `dev`
- MUST add shared TypeScript base config extended by future packages
- MUST add ESLint flat config shared across workspace
- MUST create placeholder package.json files for `apps/web`, `apps/worker`, `packages/db`, `packages/queue`, `packages/shared`
- MUST add `.env.example` documenting TechSpec environment variables
- SHOULD add Vitest workspace configuration at root
</requirements>

## Subtasks

- [x] 1.1 Initialize root `package.json` with pnpm workspaces and Turborepo
- [x] 1.2 Create shared `tsconfig.base.json` and per-package/tsconfig stubs
- [x] 1.3 Configure ESLint and Prettier at workspace root
- [x] 1.4 Scaffold `apps/` and `packages/` directory structure per TechSpec System Architecture
- [x] 1.5 Add `.env.example` with all TechSpec Integration Points env vars
- [x] 1.6 Verify `pnpm install` and `pnpm turbo lint` succeed with empty packages

## Implementation Details

Create the greenfield monorepo structure described in TechSpec **System Architecture** and **Development Sequencing** step 1. No application logic yet — only tooling and package shells.

### Relevant Files

- `package.json` — workspace root manifest
- `pnpm-workspace.yaml` — workspace package globs
- `turbo.json` — pipeline definitions
- `tsconfig.base.json` — shared TypeScript options
- `eslint.config.mjs` — shared lint rules
- `apps/web/package.json` — Next.js app placeholder
- `apps/worker/package.json` — worker app placeholder
- `packages/db/package.json` — Prisma package placeholder
- `packages/queue/package.json` — BullMQ package placeholder
- `packages/shared/package.json` — shared types placeholder
- `.env.example` — documented environment variables

### Dependent Files

- None — first task in build order

### Related ADRs

- [ADR-003: TypeScript Monorepo with BullMQ Job Pipeline](../adrs/adr-003.md) — Defines monorepo layout and package boundaries

## Deliverables

- Working pnpm + Turborepo monorepo with all package shells
- Shared TS/ESLint/Vitest configuration
- `.env.example` matching TechSpec env var list
- Unit tests with 80%+ coverage **(REQUIRED)** — smoke test for workspace config validation
- Integration tests for Turborepo pipeline execution **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `pnpm-workspace.yaml` includes `apps/*` and `packages/*` globs
  - [ ] Each placeholder package has valid `package.json` name scoped to workspace
  - [ ] `.env.example` contains `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`
- Integration tests:
  - [ ] `pnpm turbo lint` exits 0 on empty packages
  - [ ] `pnpm turbo test` runs without configuration errors
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `pnpm install` completes without errors
- All five package shells exist under `apps/` and `packages/`

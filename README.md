# LeadForge

SaaS platform for intelligent lead capture and digital opportunity analysis for Brazilian web agencies.

## Monorepo structure

- `apps/web` — Next.js web application and API routes
- `apps/worker` — BullMQ workers (Playwright scraping, analysis, artifacts)
- `packages/db` — Prisma schema and database client
- `packages/queue` — BullMQ queue definitions
- `packages/shared` — Shared types, schemas, and utilities

## Getting started

```bash
pnpm install
pnpm docker:up
pnpm test
pnpm lint
```

Copy `.env.example` to `.env` and fill in required values before running services.

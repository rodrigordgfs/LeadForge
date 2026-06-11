# LeadForge Lead Capture — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Monorepo scaffold | completed | medium | — |
| 02 | Docker Compose PostgreSQL + Redis | pending | low | task_01 |
| 03 | Prisma schema and migrations | pending | high | task_01, task_02 |
| 04 | Shared types and Zod schemas | pending | medium | task_03 |
| 05 | Segment catalog (20 segments) | pending | low | task_04 |
| 06 | Score calculator and isHighOpportunity | pending | medium | task_04 |
| 07 | BullMQ queue package | pending | medium | task_01, task_02, task_04 |
| 08 | Next.js shell and Clerk auth | pending | medium | task_01, task_03 |
| 09 | Search jobs REST API | pending | medium | task_07, task_08 |
| 10 | SSE job events endpoint | pending | medium | task_07, task_09 |
| 11 | Maps scraper Playwright module | pending | high | task_04, task_05, task_07 |
| 12 | Search worker processor | pending | medium | task_09, task_10, task_11 |
| 13 | Playwright site auditor module | pending | high | task_04, task_07 |
| 14 | PSI API client and audit merge | pending | medium | task_13 |
| 15 | Analyze worker and auto-pipeline trigger | pending | high | task_06, task_12, task_14 |
| 16 | OpenAI text artifact generator | pending | high | task_06, task_15 |
| 17 | PDF templates and base64 storage | pending | medium | task_16 |
| 18 | Artifacts worker processor | pending | medium | task_15, task_17 |
| 19 | Lead and CRM status API | pending | medium | task_03, task_08 |
| 20 | Contacts, settings, proposals, and download API | pending | medium | task_19 |
| 21 | Search form and SSE progress UI | pending | medium | task_09, task_10 |
| 22 | Search results list UI | pending | medium | task_21 |
| 23 | Lead detail UI | pending | medium | task_18, task_19, task_20, task_22 |
| 24 | CRM kanban, contact log, dashboard, and settings UI | pending | high | task_15, task_18, task_20, task_22, task_23 |

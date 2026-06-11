---
status: pending
title: OpenAI text artifact generator
type: backend
complexity: high
dependencies:
  - task_06
  - task_15
---

# Task 16: OpenAI text artifact generator

## Overview

Implement OpenAI GPT-4o integration to generate structured text artifacts: diagnosis narrative, wireframe structure, company.txt, analysis.txt, website-brief.txt, and proposal field content from lead and diagnosis data.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST use OpenAI gpt-4o with temperature 0.4 per TechSpec Artifact Pipeline
- MUST generate outputs in Brazilian Portuguese
- MUST use structured JSON response mode for parseable artifact content
- MUST build prompts from Lead fields and diagnosisJson
- MUST log prompt/response pairs to Prompt table
- MUST retry OpenAI calls 3 times with exponential backoff on transient errors
- MUST timeout individual OpenAI calls at 120 seconds
- MUST implement mock OpenAI client for CI without live API calls
</requirements>

## Subtasks

- [ ] 16.1 Create OpenAI client wrapper with retry and timeout
- [ ] 16.2 Design prompt templates for each artifact type
- [ ] 16.3 Implement structured JSON output parser with Zod validation
- [ ] 16.4 Generate company.txt, analysis.txt, website-brief.txt content
- [ ] 16.5 Generate wireframe structure and diagnosis narrative
- [ ] 16.6 Generate proposal fields (scope, value, deadline, monthlyFee)
- [ ] 16.7 Persist Prompt records for audit trail

## Implementation Details

See TechSpec **Artifact Pipeline Design** steps 1–2 and init.md TXT Generator section for output structure. Wireframe includes pages, sections, and suggested components per PRD.

### Relevant Files

- `apps/worker/src/artifacts/openai-client.ts`
- `apps/worker/src/artifacts/prompts/diagnosis.ts`
- `apps/worker/src/artifacts/prompts/wireframe.ts`
- `apps/worker/src/artifacts/prompts/txt-files.ts`
- `apps/worker/src/artifacts/prompts/proposal.ts`
- `apps/worker/src/artifacts/text-generator.ts`
- `apps/worker/src/artifacts/openai-mock.ts`

### Dependent Files

- `packages/db` — Prompt model
- `packages/shared/src/schemas/env.ts` — OPENAI_API_KEY

### Related ADRs

- [ADR-005: Artifact Storage as Base64 in PostgreSQL](../adrs/adr-005.md) — Generated content stored in next task

## Deliverables

- Text artifact generator using OpenAI GPT-4o
- Prompt templates and structured output parsers
- Mock client for CI
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests with mock OpenAI **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Text generator parses valid OpenAI JSON response into company.txt format
  - [ ] Invalid OpenAI JSON response throws typed ParseError
  - [ ] OpenAI client retries 3 times on 429 rate limit then throws
  - [ ] Prompt builder includes lead name, city, and top 3 problems from diagnosisJson
  - [ ] Generated analysis.txt includes score and opportunities sections
- Integration tests:
  - [ ] Mock OpenAI client produces all 5 text artifact types for fixture lead
  - [ ] Prompt record persisted to database after generation
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All PRD TXT file structures producible from generator
- CI runs without live OpenAI API key using mock client

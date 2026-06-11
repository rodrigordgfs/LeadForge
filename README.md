# LeadForge

Plataforma SaaS de prospecção inteligente e análise de oportunidade digital para freelancers e agências web brasileiras.

O LeadForge automatiza a descoberta de negócios locais via Google Maps, avalia a maturidade digital de cada lead (site, SEO, redes sociais, PSI), prioriza oportunidades de alto potencial e gera materiais comerciais (diagnóstico, wireframes, briefs e propostas) — tudo integrado a um CRM kanban.

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Início rápido](#início-rápido)
- [Configuração detalhada](#configuração-detalhada)
- [Executando em desenvolvimento](#executando-em-desenvolvimento)
- [Docker](#docker)
- [Estrutura do monorepo](#estrutura-do-monorepo)
- [Scripts disponíveis](#scripts-disponíveis)
- [Páginas da aplicação](#páginas-da-aplicação)
- [API REST e SSE](#api-rest-e-sse)
- [Pipeline de jobs](#pipeline-de-jobs)
- [Testes](#testes)
- [Solução de problemas](#solução-de-problemas)

---

## Funcionalidades

### Busca de leads
- Seleção por **segmento de mercado** (catálogo fixo com subcategorias), **estado**, **cidade** e **raio**
- Filtros: possui site, avaliação mínima, WhatsApp, Instagram
- Scraping de Google Maps via Playwright (até 120 resultados por busca)
- Progresso em tempo real via **Server-Sent Events (SSE)**

### Diagnóstico digital
- Auditoria híbrida: **Playwright** (SSL, responsividade, SEO básico) + **PageSpeed Insights** (Core Web Vitals)
- Score composto **0–100** com faixas: crítico, baixo, médio, excelente
- Classificação de URLs sociais (Instagram, Facebook, Linktree) vs. site real

### Pipeline inteligente de artefatos
- Geração automática para leads de **alta oportunidade** (sem site ou score ≤ limiar configurável)
- Textos via **OpenAI GPT-4o** em português brasileiro
- PDFs via **@react-pdf/renderer**
- Armazenamento base64 no PostgreSQL (cap de 5 MB por arquivo)
- Tipos: `company_txt`, `analysis_txt`, `website_brief_txt`, `proposal_pdf`, `diagnosis_pdf`, `wireframe_pdf`

### CRM e dashboard
- Kanban com **7 status** de pipeline comercial
- Log de contatos por lead
- Dashboard com métricas agregadas e contagem de oportunidades
- Configurações de limiar de oportunidade e padrões de proposta

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend / API | Next.js 15, React 19, Tailwind CSS |
| Autenticação | Clerk |
| Banco de dados | PostgreSQL 16, Prisma |
| Filas / cache | Redis 7, BullMQ |
| Workers | Node.js, Playwright |
| IA | OpenAI GPT-4o |
| Métricas web | Google PageSpeed Insights v5 |
| Monorepo | pnpm workspaces, Turborepo |
| Testes | Vitest, Testing Library |

---

## Arquitetura

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[Next.js UI]
  end

  subgraph web [apps/web]
    API[Route Handlers REST + SSE]
    Clerk[Clerk Middleware]
  end

  subgraph infra [Docker Compose]
    PG[(PostgreSQL)]
    Redis[(Redis)]
  end

  subgraph worker [apps/worker]
    SW[Search Processor]
    AW[Analyze Processor]
    ARW[Artifacts Processor]
    PW[Playwright Scraper]
    AUD[Site Auditor]
    OAI[OpenAI + PDF]
  end

  UI --> API
  API --> Clerk
  API --> PG
  API --> Redis
  API -->|enqueue| Redis
  Redis --> SW
  Redis --> AW
  Redis --> ARW
  SW --> PW
  SW --> PG
  AW --> AUD
  AW --> PG
  ARW --> OAI
  ARW --> PG
  SW & AW & ARW -->|pub/sub SSE| Redis
  Redis -->|SSE stream| API
  AW --> PSI[PageSpeed Insights API]
  ARW --> OpenAI[OpenAI API]
  PW --> Maps[Google Maps]
```

**Fluxo de dados:**

1. Usuário cria busca → `SearchJob` persistido → job enfileirado na fila `search`
2. Worker faz scrape → upsert de `Lead` → enfileira `analyze` por lead
3. Worker audita site → calcula score → se alta oportunidade, enfileira `artifacts`
4. Worker gera TXTs/PDFs → armazena base64 → emite eventos SSE
5. Frontend acompanha progresso via `/api/jobs/:id/events`

---

## Pré-requisitos

- **Node.js** 20 ou superior
- **pnpm** 9 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** e **Docker Compose** (PostgreSQL + Redis)
- Conta **[Clerk](https://clerk.com)** (autenticação obrigatória)
- Chaves opcionais para funcionalidades completas:
  - **OpenAI** — geração de artefatos de texto
  - **Google Cloud** — PageSpeed Insights API (auditoria de performance)

---

## Início rápido

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar ambiente
cp .env.example .env
# Edite .env com as chaves do Clerk (obrigatório)

# 3. Subir infraestrutura
pnpm docker:up

# 4. Aplicar migrations
pnpm db:migrate

# 5. Build dos pacotes
pnpm build

# 6. Terminal 1 — aplicação web
pnpm --filter @leadforge/web dev

# 7. Terminal 2 — workers BullMQ
pnpm --filter @leadforge/worker start
```

Acesse **http://localhost:3000**, faça login e use **Busca** em `/busca`.

---

## Configuração detalhada

### Variáveis de ambiente

Copie `.env.example` para `.env` na raiz do projeto:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL. Dev local: `postgresql://leadforge:leadforge@localhost:5434/leadforge` |
| `REDIS_URL` | Sim | URL Redis. Dev local: `redis://localhost:6379` |
| `CLERK_SECRET_KEY` | Sim | Chave secreta do Clerk |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sim | Chave pública do Clerk |
| `OPENAI_API_KEY` | Para artefatos | API key OpenAI (GPT-4o) |
| `GOOGLE_PSI_API_KEY` | Opcional | PageSpeed Insights; sem ela, auditoria usa fallback Playwright-only |
| `HIGH_OPPORTUNITY_THRESHOLD` | Não | Limiar score para auto-pipeline (padrão: `60`) |
| `SCRAPER_MAX_RESULTS` | Não | Máximo de resultados por busca (padrão: `120`) |
| `SCRAPER_CONCURRENCY` | Não | Contextos Playwright simultâneos (padrão: `2`) |

### Clerk

1. Crie uma aplicação em [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copie **Publishable Key** e **Secret Key** para o `.env`
3. Configure URLs permitidas:
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in: `http://localhost:3000/dashboard`

### Banco de dados

O Postgres do Docker expõe a porta **5434** no host (evita conflito com instâncias locais na 5432):

```bash
pnpm docker:up          # sobe postgres + redis
pnpm db:migrate         # aplica migrations Prisma
```

Para regenerar o client Prisma:

```bash
pnpm --filter @leadforge/db db:generate
```

---

## Executando em desenvolvimento

### Aplicação web (Next.js)

```bash
pnpm --filter @leadforge/web dev
```

Servidor em **http://localhost:3000**.

### Workers (BullMQ)

O worker precisa estar rodando para processar buscas, análises e artefatos:

```bash
# Build (após alterações no código do worker)
pnpm --filter @leadforge/worker build

# Iniciar processadores (search + analyze + artifacts)
pnpm --filter @leadforge/worker start
```

> **Importante:** `pnpm dev` na raiz inicia apenas o watch TypeScript dos pacotes e o Next.js — **não** executa os workers BullMQ. Use `worker start` em um terminal separado.

### Health check

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

---

## Docker

### Serviços disponíveis

| Serviço | Container | Porta (host) |
|---------|-----------|--------------|
| PostgreSQL 16 | `leadforge-postgres` | 5434 |
| Redis 7 | `leadforge-redis` | 6379 |
| Worker (Playwright) | `leadforge-worker` | — |

### Comandos

```bash
# Subir apenas Postgres + Redis (dev local com web/worker no host)
pnpm docker:up

# Subir tudo incluindo worker containerizado
docker compose up -d --build worker

# Parar serviços
pnpm docker:down

# Ver status
docker compose ps
```

O container `worker` usa URLs internas do Docker (`postgres:5432`, `redis:6379`). A aplicação web rodando no host continua usando `localhost:5434` e `localhost:6379` via `.env`.

A imagem do worker baseia-se em `mcr.microsoft.com/playwright:v1.49.0-jammy`.

---

## Estrutura do monorepo

```
LeadForge/
├── apps/
│   ├── web/                 # Next.js 15 — UI + Route Handlers (REST/SSE)
│   │   ├── app/             # App Router (páginas e API)
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Hooks (ex.: useJobEvents)
│   │   └── lib/             # Lógica de negócio da API
│   └── worker/              # Processadores BullMQ
│       ├── src/scraper/     # Playwright Maps scraper
│       ├── src/audit/       # Auditoria de sites + PSI
│       ├── src/artifacts/   # OpenAI, PDFs, storage base64
│       └── src/processors/  # Handlers search/analyze/artifacts
├── packages/
│   ├── db/                  # Prisma schema + client
│   ├── queue/               # Definições BullMQ (search, analyze, artifacts)
│   └── shared/              # Types, Zod schemas, score, segmentos, SSE
├── docker-compose.yml
├── turbo.json
├── .env.example
└── package.json
```

---

## Scripts disponíveis

Executados na **raiz** do projeto:

| Script | Descrição |
|--------|-----------|
| `pnpm install` | Instala dependências de todos os workspaces |
| `pnpm dev` | Inicia modo dev via Turborepo (Next.js + watch TS) |
| `pnpm build` | Build de produção de todos os pacotes |
| `pnpm test` | Testes de integração do workspace raiz |
| `pnpm turbo run test` | Testes de todos os pacotes |
| `pnpm lint` | ESLint em todo o monorepo |
| `pnpm format` | Prettier (write) |
| `pnpm format:check` | Prettier (check) |
| `pnpm docker:up` | `docker compose up -d` (postgres + redis) |
| `pnpm docker:down` | Para containers |
| `pnpm db:migrate` | `prisma migrate dev` com `.env` da raiz |

Por pacote:

```bash
pnpm --filter @leadforge/web dev
pnpm --filter @leadforge/web build
pnpm --filter @leadforge/worker test
pnpm --filter @leadforge/db db:migrate
```

---

## Páginas da aplicação

| Rota | Descrição |
|------|-----------|
| `/sign-in`, `/sign-up` | Autenticação Clerk |
| `/dashboard` | Métricas, leads por status, buscas recentes |
| `/busca` | Formulário de nova prospecção |
| `/busca/[searchId]` | Progresso SSE + lista de leads encontrados |
| `/leads/[id]` | Detalhe do lead, diagnóstico, artefatos, ações CRM |
| `/crm` | Kanban com drag-and-drop por status |
| `/configuracoes` | Limiar de oportunidade e padrões de proposta |

---

## API REST e SSE

Todas as rotas exigem sessão Clerk, exceto `/api/health`.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/searches` | Cria job de busca |
| `GET` | `/api/searches/:id` | Status do job + contagem de leads |
| `GET` | `/api/searches/:id/leads` | Leads paginados (score ASC, nulls last) |
| `GET` | `/api/jobs/:id/events` | Stream SSE de progresso |
| `GET` | `/api/leads` | Lista leads do usuário (CRM) |
| `GET` | `/api/leads/:id` | Detalhe + metadados de artefatos |
| `PATCH` | `/api/leads/:id` | Atualiza status CRM |
| `DELETE` | `/api/leads/:id` | Remove lead (LGPD, cascade) |
| `POST` | `/api/leads/:id/analyze` | Re-diagnóstico manual |
| `POST` | `/api/leads/:id/artifacts` | Gera artefatos manualmente |
| `GET` | `/api/leads/:id/artifacts/:type` | Download binário do artefato |
| `POST` | `/api/leads/:id/contacts` | Registra contato CRM |
| `GET` | `/api/leads/:id/contacts` | Lista contatos |
| `GET` | `/api/dashboard` | Estatísticas agregadas |
| `GET` | `/api/settings` | Configurações do usuário |
| `PATCH` | `/api/settings` | Atualiza configurações |

**Eventos SSE:** `progress`, `lead_scraped`, `lead_analyzed`, `artifact_ready`, `job_completed`, `job_failed`

**Status CRM:** `novo` → `em_contato` → `interessado` → `proposta_enviada` → `negociacao` → `fechado` / `perdido`

---

## Pipeline de jobs

```mermaid
sequenceDiagram
  participant U as Usuário
  participant W as Web API
  participant Q as Redis/BullMQ
  participant S as Search Worker
  participant A as Analyze Worker
  participant R as Artifacts Worker

  U->>W: POST /api/searches
  W->>Q: enqueue search
  W-->>U: searchJobId
  U->>W: GET /api/jobs/:id/events (SSE)

  Q->>S: search.run
  S->>S: Playwright scrape Maps
  S->>W: SSE progress, lead_scraped
  S->>Q: enqueue analyze (por lead)

  Q->>A: analyze.run
  A->>A: Hybrid audit + score
  A->>W: SSE lead_analyzed
  alt Alta oportunidade
    A->>Q: enqueue artifacts
  end

  Q->>R: artifacts.generate
  R->>R: OpenAI + PDF + base64
  R->>W: SSE artifact_ready
  R->>W: SSE job_completed
```

**Critério de alta oportunidade (ADR-001):** lead sem site real **ou** score ≤ limiar (padrão 60, configurável em `/configuracoes`).

---

## Testes

```bash
# Todos os pacotes
pnpm turbo run test lint

# Pacote específico
pnpm --filter @leadforge/web test
pnpm --filter @leadforge/worker test
pnpm --filter @leadforge/shared test
```

Testes de integração com PostgreSQL/Redis são **pulados automaticamente** quando `DATABASE_URL` ou `REDIS_URL` não estão definidos. Para executá-los:

```bash
pnpm docker:up
# garantir .env com DATABASE_URL e REDIS_URL
pnpm turbo run test
```

O scraper e OpenAI usam **fixtures/mocks** no CI — não dependem de Google Maps ou API live.

---

## Solução de problemas

### Erro de conexão com PostgreSQL

- Confirme que o Docker está rodando: `docker compose ps`
- Use porta **5434** no `.env` para dev local (não 5432)
- Rode `pnpm db:migrate` após subir o Postgres

### Login Clerk não funciona

- Verifique `CLERK_SECRET_KEY` e `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Confirme URLs de redirect no dashboard Clerk
- Reinicie o dev server após alterar variáveis `NEXT_PUBLIC_*`

### Busca criada, mas nada acontece

- O **worker** precisa estar rodando: `pnpm --filter @leadforge/worker start`
- Verifique Redis: `redis-cli ping` → `PONG`
- Confira jobs na fila via logs do worker

### Playwright / Chromium não encontrado

```bash
cd apps/worker
PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright install chromium
```

### Artefatos não são gerados

- Confirme `OPENAI_API_KEY` no `.env`
- Verifique se o lead é alta oportunidade ou dispare manualmente via **Gerar pacote completo** na UI
- Consulte logs do worker para erros OpenAI/timeout (SLA: 5 min por job)

### PSI retorna vazio

- `GOOGLE_PSI_API_KEY` opcional; sem ela a auditoria usa heurísticas Playwright-only (`psi_available: false`)

---

## Licença

Projeto privado. Todos os direitos reservados.

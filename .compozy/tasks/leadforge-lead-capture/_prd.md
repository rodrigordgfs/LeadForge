# LeadForge — Lead Capture & Digital Opportunity Platform

## Overview

LeadForge is a SaaS platform for Brazilian freelancers and web design agencies who prospect local small and medium businesses (SMBs) that lack adequate digital presence. Users select an industry segment and geographic location; the platform mines public business listings, collects commerce contact and reputation data, evaluates each business's website and digital maturity, and prioritizes high-opportunity leads.

For leads with no website or weak digital presence, LeadForge automatically produces professional sales artifacts — digital diagnosis, wireframes, structured AI-ready briefs, and commercial proposals — and manages the full outreach pipeline through an integrated CRM.

**Primary users:** Freelancers and agencies selling websites and digital services to local SMBs in Brazil.

## Goals

1. Reduce manual Google Maps prospecting from hours to minutes per city/segment search.
2. Surface businesses without websites or with critically weak digital presence as prioritized opportunities.
3. Deliver actionable digital maturity scores (0–100) so users focus on leads most likely to convert.
4. Automate creation of diagnosis reports, wireframes, structured TXT briefs, and commercial proposals for high-opportunity leads.
5. Provide end-to-end lead management from discovery through closed deal.

**Target timeline:** MVP usable by a single agency completing a full prospecting-to-proposal cycle within one session.

## User Stories

### Primary persona: Web agency owner / freelancer

- As an agency owner, I want to search businesses by segment and city so that I find local prospects without manual Maps scrolling.
- As a freelancer, I want to see which businesses have no website so that I pitch site creation to warm prospects.
- As a salesperson, I want a digital maturity score per lead so that I prioritize outreach on the weakest digital presence first.
- As an agency owner, I want automatic diagnosis and proposal generation for high-opportunity leads so that I contact prospects with professional materials ready.
- As a user, I want to manage lead status in a CRM so that I track my pipeline from first contact to closed deal.
- As a user, I want to export PDFs and structured TXT files so that I use outputs in presentations and AI website builders.

### Secondary persona: Agency team member (SDR)

- As an SDR, I want to filter leads by WhatsApp availability and minimum rating so that I reach responsive, reputable businesses.
- As an SDR, I want to log contact notes and next follow-up dates so that nothing falls through the cracks.

## Core Features

### 1. Business Search (Lead Discovery)

**Priority:** P0 — MVP

Users configure a search with:

- **Location:** Estado, cidade, raio (km)
- **Segment:** One of 20 fixed industry segments with optional subcategory (e.g., Saúde → Dentista)
- **Filters:** Possui site / Não possui site, avaliação mínima, possui WhatsApp, possui Instagram

The platform returns a list of matching businesses with: name, category, address, city, state, phone, WhatsApp, email, website, Instagram, Facebook, rating, review count.

Each result includes an immediate digital maturity score (0–100) after analysis completes.

### 2. Digital Diagnosis

**Priority:** P0 — MVP

For each business, evaluate:

**Website:** presence, SSL, responsiveness, performance, SEO basics, own domain

**Social media:** Instagram, Facebook, LinkedIn, TikTok presence and activity signals

**Google Business:** verified profile, rating, review count

Output: list of identified problems (e.g., no website, slow site, no SSL, abandoned social) and opportunities (e.g., institutional site, local SEO, WhatsApp integration).

### 3. Digital Maturity Score

**Priority:** P0 — MVP

Composite 0–100 score with bands:

- 0–40: Critical
- 41–60: Low
- 61–80: Medium
- 81–100: Excellent

Score drives automatic pipeline triggering (see Smart Prospecting in ADR-001).

### 4. Smart Artifact Pipeline

**Priority:** P0 — MVP

**Automatic (high-opportunity leads only — no website OR score ≤ 60):**

- Professional diagnosis report
- Wireframe (textual structure + visual representation + page structure + suggested components)
- Structured TXT files: `company.txt`, `analysis.txt`, `website-brief.txt`
- Commercial proposal draft with scope, value, timeline, retainer fields
- PDF exports: proposal, diagnosis, wireframe

**Manual trigger:** Available for any lead regardless of score.

### 5. CRM

**Priority:** P0 — MVP

Lead statuses: Novo → Em Contato → Interessado → Proposta Enviada → Negociação → Fechado / Perdido

Capabilities: status transitions, contact history (date, notes, status, next contact date), lead detail view with all collected data and generated artifacts.

### 6. Dashboard

**Priority:** P1 — MVP

At-a-glance view: total leads, leads by status, recent searches, high-opportunity count, pipeline value summary.

### 7. Reports & Analytics

**Priority:** P2 — Phase 2

Search history, conversion rates by segment/city, score distribution, artifact generation stats.

### 8. Settings

**Priority:** P1 — MVP

User profile, high-opportunity score threshold (default ≤ 60), proposal template defaults (company branding, default scope language).

## User Experience

### Primary flow: Search to closed deal

1. **Configure search** — User selects segment (e.g., Beleza → Barbearia), estado, cidade, raio, optional filters.
2. **Review results** — Platform displays businesses sorted by opportunity (lowest score first). Each row shows name, rating, website status, score badge, WhatsApp indicator.
3. **Auto-processing** — High-opportunity leads receive full diagnosis + artifacts in background. User sees progress indicators.
4. **Explore lead detail** — User opens a lead: contact info, diagnosis problems/opportunities, score breakdown, generated wireframe preview, downloadable TXT/PDF.
5. **Outreach** — User contacts via phone/WhatsApp using provided data. Logs interaction in CRM.
6. **Send proposal** — User reviews auto-generated proposal, adjusts value/scope, exports PDF, marks status "Proposta Enviada".
7. **Pipeline management** — User moves leads through CRM statuses until Fechado or Perdido.

### Onboarding

First-login guided tour: run first search → interpret score → review auto-generated diagnosis for one lead → understand CRM statuses.

### UX principles

- Portuguese (Brazil) throughout
- Score and website status visible at every list level
- One-click access to WhatsApp/phone
- Clear distinction between auto-processed and manual-action-needed leads
- Mobile-responsive for field prospecting (view leads, log contacts)

## High-Level Technical Constraints

- **Market:** Brazil only at launch; all user-facing content in Brazilian Portuguese.
- **Data sources:** Public business listing data (primarily Google Maps ecosystem).
- **Privacy (LGPD):** Business contact data is publicly sourced; platform must provide data retention policy, user consent on signup, and ability to delete lead records.
- **Performance (user-facing):** Search results with basic data within 60 seconds for a typical city+segment query; score available within 2 minutes per lead batch; full artifact pipeline within 5 minutes per high-opportunity lead.
- **Reliability:** Users must be able to re-run diagnosis on stale leads (>30 days).

## Non-Goals (Out of Scope)

- International markets beyond Brazil in MVP
- Free-form keyword search outside the 20-segment catalog
- Automated WhatsApp/email outreach sending (user initiates contact manually)
- Payment processing or contract signing
- White-label multi-tenant agency branding in MVP
- CNPJ enrichment or Receita Federal integration (deferred)
- AI chat assistant for lead analysis (deferred to Phase 3)
- Native mobile apps (web-responsive only)

## Phased Rollout Plan

### MVP (Phase 1) — Full core loop

**Includes:** Search, data collection, digital diagnosis, score, smart artifact pipeline, CRM, dashboard basics, settings, PDF/TXT export.

**Success criteria to proceed:**

- User completes search → score → auto-artifacts → CRM update for 10+ leads in one session
- ≥ 80% of "no website" businesses correctly classified
- Agency beta users report ≥ 50% time savings vs. manual Maps prospecting

### Phase 2 — Intelligence & scale

- Advanced analytics and search history
- Batch operations (bulk status change, bulk re-diagnosis)
- Proposal template library
- Email notification on pipeline completion

### Phase 3 — Growth features

- CNPJ enrichment
- AI outreach message suggestions
- Team multi-user with role permissions
- International expansion groundwork

## Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Time to first scored lead list | < 3 min from signup |
| Search-to-proposal cycle time | < 15 min per high-opportunity lead |
| "No website" detection accuracy | ≥ 85% (validated sample) |
| Auto-pipeline completion rate | ≥ 95% for triggered leads |
| Weekly active users completing ≥ 1 search | ≥ 60% of registered users |
| Lead-to-proposal conversion (user-reported) | ≥ 20% of CRM "Proposta Enviada" leads |
| User-reported time savings | ≥ 50% vs. manual prospecting |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Low data quality for some cities/segments | Show data freshness timestamp; allow re-search; track coverage gaps |
| Users overwhelmed by result volume | Default sort by score ascending; filter presets for "sem site" |
| Generated proposals feel generic | Structured TXT inputs from real diagnosis data; editable before export |
| LGPD concerns from prospects | Public-data-only sourcing; clear privacy policy; no bulk unsolicited messaging built-in |
| Segment catalog misses user niches | Analytics on segment usage; quarterly catalog review |
| Competitors (RadarLeads, Capturo) with WhatsApp automation | Differentiate on full sales artifact pipeline, not just extraction |

## Architecture Decision Records

- [ADR-001: Smart Prospecting Pipeline Approach](adrs/adr-001.md) — Full artifact pipeline runs automatically only for high-opportunity leads (no website or score ≤ 60); manual trigger available for all.
- [ADR-002: Brazil-First Market with Fixed Segment Catalog](adrs/adr-002.md) — Launch Brazil-only with 20 fixed industry segments from init.md; no free-form keyword search in MVP.

## Open Questions

1. What is the default raio (km) for city searches — 5 km, 10 km, or city-wide?
2. Should subcategory be required or optional when selecting a segment?
3. Maximum leads returned per search — 60, 120, or unlimited with pagination?
4. Pricing model: per-search credits, monthly subscription, or freemium with limits?
5. Should the platform store generated artifacts indefinitely or expire after N days on free tier?
6. Is team/multi-user access required in MVP or strictly single-user?

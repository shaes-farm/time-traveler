# Project Context

- **Owner:** SHAES Farm
- **Project:** Time Traveler — A temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time.
- **Stack:** Next.js 16+, TypeScript, Supabase (Auth, Storage, Realtime, RLS), PostgreSQL with JSONB, pnpm workspaces, Turborepo
- **Created:** 2026-03-23

## Core Context

### What We're Building

Time Traveler is a temporal CMS spanning from the Big Bang to the speculative future. Key PM concerns for this project:

- **PRD:** docs/prd/PRD-0001-time-traveler-system.md — source of truth for all features. Read this before decomposing any work.
- **Current state:** Turborepo boilerplate only. No Time Traveler features are implemented yet. Starting from scratch on the `rebuild-app-from-scratch` branch.
- **Critical path:** Architecture (Cooper) → Schema (TARS) → API contracts (TARS+Cooper) → Frontend (Brand) + Infra (CASE) in parallel → Tests (Romilly)
- **Biggest risk:** The hybrid temporal JSONB system — if the data model is wrong, everything built on top of it needs rebuilding. Cooper must sign off before TARS writes migrations.

### Team Topology

| Agent | Role | What they own |
|-------|------|---------------|
| Cooper | Lead | Architecture, scope, code review |
| Brand | Frontend | Next.js, React, UI, timeline viz |
| TARS | Backend | Supabase, PostgreSQL, RLS, schema |
| CASE | Infra | CI/CD, Vercel, migrations deployment |
| Romilly | Tester | Tests, edge cases, QA |
| Scribe | Logger | Session logs, decisions (silent) |
| Ralph | Monitor | Work queue (silent) |

### Task Routing Rules

- Architecture review needed first → Cooper
- Schema / backend work → TARS (only after Cooper signs off on design)
- React / Next.js / UI → Brand
- CI/CD / Vercel / env config → CASE
- Test cases / QA → Romilly (can start test planning in parallel with implementation)
- PM / sequencing / breakdown → Murph (me)

## Learnings

### 2026-03-23: Build order decided (cross-agent from Cooper)

Cooper completed the build-order analysis. 7-phase sequence locked:

| Phase | What | Owner | Reviewer |
|-------|------|-------|----------|
| 0 | Supabase + Schema + RLS | TARS | Cooper |
| 1 | Temporal Core (TS) | TARS | Romilly |
| 2 | Service Layer + Hooks | TARS | Cooper |
| 3 | Auth + UI Shell + TemporalInput | Brand + TARS | Cooper |
| 4 | Timeline + Event UI | Brand | Romilly |
| 5 | Characters + Relationships | Brand + TARS | Cooper |
| 6 | Stories + Categories + Periods | Brand | Cooper |
| 7 | Timeline Visualization (D3) | Brand | Cooper |

7 architectural decisions locked, 12 items deferred from MVP. Use this for task decomposition and sequencing. See `.squad/decisions.md` for full details.


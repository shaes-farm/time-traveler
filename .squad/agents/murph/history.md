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

### 2026-03-23: Full MVP decomposition into GitHub issues

Decomposed the PRD and system design into **58 GitHub issues** (#12–#69) across **8 milestones** (Phases 0–7). All issues have:
- Detailed acceptance criteria with checkboxes
- Dependency chains (depends-on references)
- Squad member assignments via labels (squad:tars, squad:brand, squad:cooper, etc.)
- Milestone tags matching Cooper's 7-phase build order
- Category labels (backend, frontend, infrastructure, testing, etc.)

**Issue distribution by phase:**
- Phase 0: #12–#22 (11 issues) — Foundation
- Phase 1: #23–#27 (5 issues) — Shared Logic
- Phase 2: #28–#34 (7 issues) — Service Layer
- Phase 3: #35–#41 (7 issues) — Auth & App Shell
- Phase 4: #42–#50 (9 issues) — Timeline & Event CRUD
- Phase 5: #51–#57 (7 issues) — Characters & Relationships
- Phase 6: #58–#64 (7 issues) — Stories, Categories & Periods
- Phase 7: #65–#69 (5 issues) — Timeline Visualization

**Blocked:** GitHub project board requires `read:project` scope. Run `gh auth refresh -s read:project` to unblock.


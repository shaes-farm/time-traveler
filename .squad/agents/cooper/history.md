# Project Context

- **Owner:** SHAES Farm
- **Project:** Time Traveler — A temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time.
- **Stack:** Next.js 16+, TypeScript, Supabase (Auth, Storage, Realtime, RLS), PostgreSQL with JSONB, pnpm workspaces, Turborepo
- **Created:** 2026-03-22

## Core Context

### What We're Building

Time Traveler is a temporal CMS handling events from the Big Bang (13.8 billion years ago) to the speculative future. Key domain concepts:

- **Hybrid Temporal System** — JSONB date representation for prehistoric/geological/cosmological dates with precision metadata and uncertainty ranges. SQL `DATE` type is not adequate — the system must support "13.8 billion years ago" with the same facility as "March 15, 44 BCE at 2:30 PM".
- **Fractal Time Navigation** — Events contain nested sub-events; seamless zoom from billion-year scales to individual seconds
- **Character System** — 7 types: Human, Animal, Mythological, Fictional, Organization, Divine, Artifact
- **Narrative/Story Layer** — Multiple stories reference the same events with different perspectives
- **Publishing Workflow** — Draft vs. published states for all entities (timelines, events, characters, periods, stories)
- **Role-Based Access** — Admin, Editor, Viewer with Supabase RLS enforcement at the database level

### Tech Stack

- **Frontend:** Next.js 16+, React, TypeScript (apps/admin, apps/docs)
- **Backend:** Supabase (Auth, Storage, Realtime, Row Level Security, Edge Functions)
- **Database:** PostgreSQL with JSONB (hybrid temporal data)
- **Packages:** packages/ui (shared React components), packages/eslint-config, packages/typescript-config
- **Monorepo:** pnpm workspaces, Turborepo

### Key Files

- PRD: docs/prd/PRD-0001-time-traveler-system.md
- Admin app: apps/admin/
- Docs app: apps/docs/
- Shared UI: packages/ui/

## Learnings

### 2026-03-23: Build order analysis and architectural sequencing

**Context:** SHAES Farm asked "what should we build first?" — full PRD and system-design review completed.

**Key decisions recorded:**
- The hybrid temporal JSONB system + Supabase schema is the single most critical foundation. Everything depends on `temporal_data` JSONB, `sort_order_years` generated columns, and era conversion logic being correct before any UI work begins.
- RLS ships in the initial migration — not retrofitted. Four-clause read pattern: published OR owner OR admin OR collaborator.
- No stored procedures for CRUD — PostgREST + client service layer. DB functions only for read-only complex queries.
- Separate start/end temporal columns (two JSONB + two sort columns per entity), not embedded.
- TemporalService lives in TypeScript (client-side temporal logic), not database.
- UUIDs for all primary keys (enables optimistic inserts).
- ON DELETE CASCADE everywhere (eliminates manual cascade deletion).

**Build sequence (7 phases):**
Phase 0: Supabase setup + full initial schema migration + types + RLS (TARS, reviewed by Cooper)
Phase 1: Temporal core — Zod schemas, TemporalService, slug utility, unit tests (TARS + Romilly)
Phase 2: Entity service layer — CRUD services, TanStack Query hooks, Zustand stores (TARS)
Phase 3: Auth + UI shell + TemporalInput component (Brand + TARS)
Phase 4: Timeline + Event CRUD UI (Brand + Romilly)
Phase 5: Characters + Relationships (Brand + TARS)
Phase 6: Stories + Categories + Periods (Brand)
Phase 7: Timeline visualization with D3.js, log scale, fractal zoom (Brand)

**Deferred from MVP:** Real-time collaborative editing, full-text search UI, bulk import/export, curated content library, map visualization, temporal comparison view, content moderation UI, mobile optimization, geocoding, PDF/HTML export, OAuth beyond email.

**Key file paths:**
- PRD: `docs/prd/PRD-0001-time-traveler-system.md`
- System design: `docs/system-design.md`
- Decision written to: `.squad/decisions/inbox/cooper-build-order.md`

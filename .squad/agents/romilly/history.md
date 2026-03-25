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

### 2026-03-23: Build order decided — your phase assignments (cross-agent from Cooper)

Cooper completed the build-order analysis. Your assignments:

- **Phase 1** (Temporal Core): Write exhaustive unit tests for TemporalService and Zod schemas. Every era, every edge case (year 0, negative years, BYA precision, uncertainty rendering). This is the one area with heavy early test investment. Gate: all conversions correct, display formatting matches spec §6.2, sort ordering mathematically correct across all eras.
- **Phase 4** (Timeline + Event CRUD UI): Integration tests for timeline and event CRUD pages.

No test framework is configured yet — that will need to be set up as part of Phase 1 work. See `.squad/decisions.md` for full build order and architectural locks.

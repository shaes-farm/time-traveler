# Project Context

- **Owner:** SHAES Farm
- **Project:** Time Traveler — A temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time.
- **Stack:** Next.js 14+, TypeScript, Supabase (Auth, Storage, Realtime, RLS), PostgreSQL with JSONB, pnpm workspaces, Turborepo
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

- **Frontend:** Next.js 14+, React, TypeScript (apps/admin, apps/docs)
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


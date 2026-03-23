# Project Context

- **Owner:** SHAES Farm
- **Project:** Time Traveler — A temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time.
- **Stack:** Next.js 16+, TypeScript, Supabase (Auth, Storage, Realtime, RLS), PostgreSQL with JSONB, pnpm workspaces, Turborepo
- **Created:** 2026-03-22

## Core Context

Team hired 2026-03-22: Cooper (Lead), Brand (Frontend Dev), TARS (Backend Dev), Romilly (Tester). Universe: Interstellar. Project is a passion-project temporal CMS.

## Recent Updates

📌 Team initialized on 2026-03-22 — full roster set up, charters written, casting state established.

## Learnings

- Append-only drop-box pattern: agents write to `.squad/decisions/inbox/{name}-{slug}.md`, Scribe merges.
- All `.squad/` paths must be resolved from TEAM ROOT provided in spawn prompt.

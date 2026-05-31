---
title: "ADR-0001: Supabase as the Backend Platform"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-03-01"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "platform", "backend", "supabase"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0001: Supabase as the Backend Platform

## Status

**Accepted (retroactively documented 2026-05-30)** — dated to the platform
decision recorded in `docs/system-design.md` v3.0 (March 2026, §1.3, §2). This
ADR records a decision that was already made and implemented; it does not
re-open it.

## Context

Time Traveler is a greenfield temporal CMS that needs persistence, multi-user
authentication, fine-grained authorization, file storage, real-time
collaboration signals, and an API surface — across a data model that spans
prehistoric/cosmological dates and seven character types. The team is small and
the priority is shipping product features, not operating bespoke infrastructure.

A conventional approach would be a hand-written backend API (Node/Express,
NestJS, or similar) sitting in front of PostgreSQL, plus separately provisioned
auth, object storage, and a websocket tier. That is a large amount of
undifferentiated plumbing to build and maintain before any temporal feature
ships.

## Decision

Adopt **Supabase** as the single backend platform. Supabase provides managed
PostgreSQL, auto-generated REST (PostgREST), Auth, Realtime, Edge Functions
(Deno), and Storage. There is **no custom backend API layer**: the schema _is_
the API, authorization lives in Row Level Security (RLS), and the only
server-side code is Edge Functions for orchestration that cannot run on the
client. See `docs/system-design.md` §1.3 and §2.1–2.3.

## Consequences

### Positive

- **POS-001**: Eliminates an entire backend service — PostgREST auto-generates
  CRUD + nested joins from the schema, so there is no controller/route layer to
  build or keep in sync with the database.
- **POS-002**: Authorization is centralized in RLS (see ADR-0014), so every
  access path — PostgREST, direct SQL, Edge Functions — enforces identical
  rules.
- **POS-003**: Auth, Storage, and Realtime are first-party and integrated with
  the same Postgres identity (`auth.users` UUIDs), simplifying the data model
  (see ADR-0017).
- **POS-004**: `supabase gen types typescript` produces end-to-end types from
  the database, feeding the typed service layer (ADR-0019).

### Negative

- **NEG-001**: Strong coupling to a single vendor's surface (PostgREST query
  semantics, RLS, Edge Function runtime/timeouts). Portability away from
  Supabase would require re-implementing the API and auth layers.
- **NEG-002**: Business logic is pushed to two poles — the database (RLS,
  generated columns, read functions) and the client/Edge Functions — with no
  conventional middle tier, which constrains how some logic can be expressed.
- **NEG-003**: Edge Functions inherit Deno + 30s timeout constraints, shaping
  bulk import/export design (see `docs/system-design.md` §5.5).

## Alternatives Considered

### Custom Node/Express API + self-managed Postgres

- **ALT-001**: **Description**: Hand-rolled REST/GraphQL API, separate auth
  (e.g., Auth.js), object storage (S3), and websocket service.
- **ALT-002**: **Rejection Reason**: Maximum control but maximum undifferentiated
  work; the team would build auth, RLS-equivalent authorization, type
  generation, and realtime from scratch before any temporal feature.

### Firebase / Firestore

- **ALT-003**: **Description**: Managed NoSQL document store with built-in auth
  and realtime.
- **ALT-004**: **Rejection Reason**: The temporal sort/range model and the
  relational character/event/junction graph need SQL — generated columns,
  recursive CTEs, full-text search, and relational integrity — which a document
  store does not provide naturally.

## Implementation Notes

- **IMP-001**: All schema, RLS, functions, and views ship as numbered SQL
  migrations under `supabase/migrations/` (`00001`–`00015`).
- **IMP-002**: Local development uses the Supabase CLI (`pnpm run db:start`,
  `db:reset`, `db:test`); deployment uses `supabase db push`.
- **IMP-003**: Service-role secrets are server-only; the anon key is the only
  Supabase credential exposed to the browser (see ADR-0017, ADR-0019).

## References

- **REF-001**: ADR-0012 (PostgREST for CRUD), ADR-0013 (read-only DB functions),
  ADR-0014 (RLS authorization), ADR-0016 (Storage), ADR-0017 (Auth bootstrap)
- **REF-002**: `docs/system-design.md` §1.3, §2.1–2.3, §5
- **REF-003**: Supabase platform documentation (PostgREST, Auth, RLS, Realtime,
  Storage, Edge Functions)

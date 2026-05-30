---
title: "ADR-0012: PostgREST for CRUD with a Thin TypeScript Service Layer"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "api", "postgrest", "services"]
supersedes: ""
superseded_by: ""
---

# ADR-0012: PostgREST for CRUD with a Thin TypeScript Service Layer

## Status

**Accepted (retroactively documented 2026-05-30)** — specified in
`docs/system-design.md` §5 (Appendix B Design Decision #2); realized by the
schema in `00001`/`00002` (FKs + `ON DELETE CASCADE`) and the
`@repo/services` modules.

## Context

Every content entity needs create/read/update/delete. The team had to choose
between writing stored-procedure CRUD in the database, building a bespoke API
server, or using Supabase's auto-generated PostgREST endpoints. A prior schema
exposed `create_*`/`update_*`/`publish_*` SQL functions and hit
parameter-shadowing bugs and duplicated validation already expressed in the
schema and RLS.

## Decision

Use **PostgREST (the Supabase auto-generated REST/`supabase-js` query API) for
all standard CRUD**. Do **not** write stored-procedure CRUD. A **thin TypeScript
service layer** (`@repo/services`) wraps PostgREST to:

- compose multi-step operations (e.g., create an event _then_ insert its
  `event_characters`/`event_media` junction rows),
- run Zod validation at the boundary (ADR-0019),
- and shape typed results for the apps.

Multi-step junction writes are **non-atomic** by default — accepted because RLS
guarantees no partial write can escape the owner's own data, and the affected
operations are low-stakes link inserts (`docs/system-design.md` §5). Referential
cleanup is handled by `ON DELETE CASCADE` (ADR-0010), not delete procedures.

## Consequences

### Positive

- **POS-001**: No CRUD code to write or maintain in SQL — the schema + RLS + Zod
  are the contract; eliminates the prior `create_*`/`publish_*` function bugs.
- **POS-002**: `supabase-js` gives typed, filterable queries directly from the
  apps; the service layer only exists where composition/validation adds value.
- **POS-003**: `ON DELETE CASCADE` removes the need for delete stored procedures.

### Negative

- **NEG-001**: Multi-step junction inserts are non-atomic — a partial failure can
  leave an event without all its links; mitigated by RLS scoping and, where true
  atomicity is required later, a targeted RPC (ADR-0013) can be added.
- **NEG-002**: Business rules that PostgREST/RLS can't express must live in the
  TypeScript service, so logic is split between DB constraints and app code.
- **NEG-003**: Direct PostgREST access from apps means query correctness/policy
  awareness is partly the caller's responsibility.

## Alternatives Considered

### Stored-procedure CRUD (the prior schema)

- **ALT-001**: **Description**: `create_event()`, `update_character()`,
  `publish_timeline()`, … in SQL.
- **ALT-002**: **Rejection Reason**: Duplicates schema/RLS validation, suffered
  parameter-shadowing bugs, and couples the API surface to migrations.

### A bespoke Node/Next API server in front of the database

- **ALT-003**: **Description**: Hand-written REST/GraphQL endpoints.
- **ALT-004**: **Rejection Reason**: Re-implements what PostgREST + RLS already
  provide; more infrastructure and auth plumbing for no current benefit.

## Implementation Notes

- **IMP-001**: Service modules live in `packages/services/src/modules/`; clients
  in `packages/services/src/supabase/` (ADR-0019).
- **IMP-002**: Complex/relational **reads** are the exception and go through
  STABLE SQL functions (ADR-0013), not PostgREST chained queries.
- **IMP-003**: If an operation needs atomic multi-row writes, add a focused
  `SECURITY INVOKER` RPC rather than reintroducing CRUD procedures.

## References

- **REF-001**: ADR-0013 (read-only DB functions), ADR-0010 (CASCADE cleanup),
  ADR-0019 (services package + Zod), ADR-0014 (RLS as the guardrail)
- **REF-002**: `docs/system-design.md` §5 and Appendix B Decision #2
- **REF-003**: PostgREST / Supabase data API documentation

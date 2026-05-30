---
title: "ADR-0013: Database Functions for Complex Reads Only"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "api", "database-functions"]
supersedes: ""
superseded_by: ""
---

# ADR-0013: Database Functions for Complex Reads Only

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00008_database_functions.sql` (2026-05-22), extended by
`00015_get_user_recent_counts.sql` (2026-05-29, #41); specified in
`docs/system-design.md` §5.4 (Appendix B Decision #3).

## Context

PostgREST handles CRUD (ADR-0012), but some reads are graph/range/aggregate
queries that are awkward or impossible to express as chained client queries:
events within a hybrid-temporal range, a character's relationship network to N
hops, events shared by two characters, and per-user dashboard metrics. The
question is where that logic should live.

## Decision

Implement **complex reads as SQL functions**, and reserve database functions for
**reads (and read-like aggregates) only** — never CRUD. The set:

- `events_in_temporal_range(...)` — range query over the `sort_order` encoding
  (ADR-0005),
- `character_network(p_character_id, p_depth)` — recursive relationship traversal
  (ADR-0008),
- `events_shared_by_characters(...)` — intersection of event participation,
- `get_user_metrics(...)` — dashboard counts,
- `get_user_recent_counts(...)` — "▴ N new since" badge counts (`00015`,
  mirroring `get_user_metrics`).

Functions are `STABLE` where they only read. Aggregate/metrics functions that must
read across users are `SECURITY DEFINER` with `search_path = ''` (ADR-0015) and
return only counts.

## Consequences

### Positive

- **POS-001**: Graph/range/aggregate logic runs close to the data in one round
  trip, instead of N chained client queries.
- **POS-002**: A clear rule — "functions read, PostgREST writes" — keeps the API
  surface predictable and avoids the prior schema's CRUD-in-SQL problems
  (ADR-0012).
- **POS-003**: `get_user_recent_counts` reuses the exact shape of
  `get_user_metrics`, so the dashboard's metric and "new since" badges share a
  pattern.

### Negative

- **NEG-001**: Read logic is split between SQL functions and the TypeScript
  service layer; contributors must know which reads are functions.
- **NEG-002**: `SECURITY DEFINER` metric functions bypass RLS by design, so they
  must be written defensively (count-only output, hardened `search_path`) — a
  standing review burden (ADR-0015).
- **NEG-003**: Function signatures are migration-versioned; changing a return
  shape needs a migration and a `db:gen:types` regeneration.

## Alternatives Considered

### Express everything through PostgREST chained queries / client-side joins

- **ALT-001**: **Description**: Build network/range/shared-event reads from
  multiple `supabase-js` calls.
- **ALT-002**: **Rejection Reason**: Recursive network traversal and temporal-range
  scans are impractical client-side and chatty; SQL does them in one call.

### Put complex reads in the TypeScript service with raw SQL

- **ALT-003**: **Description**: Hold the SQL as strings in `@repo/services`.
- **ALT-004**: **Rejection Reason**: Loses migration versioning, type generation,
  and the ability to grant/secure the function; DB functions are the better home
  for stable read contracts.

## Implementation Notes

- **IMP-001**: All read functions in `00008`; `get_user_recent_counts` in `00015`
  (`SECURITY DEFINER`, `search_path = ''`, count-only).
- **IMP-002**: `events_in_temporal_range` consumes the era-conversion `sort_order`
  from ADR-0005 (`docs/system-design.md` §4, §5.4).
- **IMP-003**: All functions are search-path-hardened per ADR-0015 (`00010`).

## References

- **REF-001**: ADR-0012 (PostgREST for CRUD), ADR-0005 (temporal sort_order),
  ADR-0008 (relationship graph), ADR-0015 (function hardening), ADR-0021
  (dashboard consuming metrics)
- **REF-002**: `supabase/migrations/00008_database_functions.sql`,
  `00015_get_user_recent_counts.sql`; `docs/system-design.md` §5.4
- **REF-003**: PRD §4 (dashboard, networks, temporal queries)

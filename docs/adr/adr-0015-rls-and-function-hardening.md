---
title: "ADR-0015: RLS and Function Hardening — SECURITY DEFINER Helpers, search_path, InitPlan, security_invoker Views"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-23"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "security", "rls", "performance"]
supersedes: ""
superseded_by: ""
---

# ADR-0015: RLS and Function Hardening — SECURITY DEFINER Helpers, search_path, InitPlan, security_invoker Views

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented across
`00006_database_views.sql` (2026-05-22),
`00007_rls_policies.sql` (2026-05-22),
`00010_function_search_path_hardening.sql` (2026-05-23, #112), and
`00011_rls_performance_hardening.sql` (2026-05-23, #115). Specified in
`docs/system-design.md` §3.2 and §9.

## Context

The RLS model (ADR-0014) introduced three follow-on problems that the initial
policy migration could not all solve at once: (1) ownership/collaborator checks
that reference the same tables they protect cause **recursive policy evaluation**
(Postgres error `42P17`); (2) functions without a fixed `search_path` are exposed
to **search-path injection**; and (3) naive policies re-evaluate `auth.uid()` /
`is_admin()` **per row** and stack duplicate permissive `SELECT` policies, which
is slow at scale. Views over RLS tables also need to respect the querying user's
permissions.

## Decision

Fold four related hardening measures into one standard:

1. **`SECURITY DEFINER` helper functions** — `is_timeline_owner()`,
   `is_timeline_collaborator()`, `is_timeline_collab_editor()` — to break the
   `42P17` recursion by checking membership outside the recursive policy context.
2. **`search_path = ''` on every function** (`00010`) — all six existing
   functions are pinned to an empty search path with fully-qualified references,
   closing the injection vector.
3. **InitPlan wrapping + split policies** (`00011`) — wrap `auth.uid()` /
   `is_admin()` in `(select …)` so Postgres evaluates them **once per query**
   (InitPlan) rather than per row, and split each `write_* FOR ALL` policy into
   separate `INSERT`/`UPDATE`/`DELETE` policies to remove the duplicate permissive
   `SELECT` branch.
4. **`security_invoker` views** (`00006`) — views run with the querying user's
   privileges so RLS still applies through them.

## Consequences

### Positive

- **POS-001**: Eliminates `42P17` recursive-policy failures while keeping
  collaborator-aware authorization.
- **POS-002**: All functions are injection-hardened (`search_path = ''`),
  satisfying Supabase's linter and #112.
- **POS-003**: RLS predicates evaluate auth helpers once per query, and removing
  duplicate permissive SELECT policies measurably cuts per-row overhead (#115).
- **POS-004**: `security_invoker` views cannot be used to leak rows past RLS.

### Negative

- **NEG-001**: `SECURITY DEFINER` helpers run with elevated privileges and must be
  written defensively (fixed `search_path`, minimal surface) — a permanent review
  obligation.
- **NEG-002**: Splitting `FOR ALL` into per-command policies multiplies the number
  of policies to maintain and keep in sync.
- **NEG-003**: The `(select auth.uid())` InitPlan idiom is non-obvious; future
  policy authors must follow it or silently reintroduce per-row evaluation.

## Alternatives Considered

### Inline ownership/collaborator checks directly in each policy

- **ALT-001**: **Description**: Subquery the collaborator/owner tables inside every
  policy.
- **ALT-002**: **Rejection Reason**: Triggers `42P17` recursion and duplicates the
  logic across many policies; centralizing in `SECURITY DEFINER` helpers is both
  correct and DRY.

### Leave functions on the default search_path / keep `FOR ALL` policies

- **ALT-003**: **Description**: Accept the linter warnings and per-row evaluation.
- **ALT-004**: **Rejection Reason**: Leaves an injection vector (#112) and a
  documented performance regression (#115); both were explicitly remediated.

## Implementation Notes

- **IMP-001**: Helpers + base policies in `00006`/`00007`; search-path hardening in
  `00010` (37 lines, config-only over 6 functions); InitPlan/split-policy rewrite
  in `00011` (593 lines).
- **IMP-002**: New functions must declare `search_path = ''`; new policies must
  wrap auth calls in `(select …)` and avoid `FOR ALL` where a permissive SELECT
  would be duplicated.
- **IMP-003**: These migrations are pure security/perf refactors — no schema or
  data change.

## References

- **REF-001**: ADR-0014 (the RLS model being hardened), ADR-0013 (functions also
  hardened), ADR-0006 (views)
- **REF-002**: `supabase/migrations/00006_database_views.sql`,
  `00007_rls_policies.sql`, `00010_function_search_path_hardening.sql`,
  `00011_rls_performance_hardening.sql`; `docs/system-design.md` §3.2, §9; issues
  #112, #115
- **REF-003**: Supabase database linter (function_search_path_mutable, RLS InitPlan)
  guidance

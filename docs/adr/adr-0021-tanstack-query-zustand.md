---
title: "ADR-0021: TanStack Query for Server State, Zustand for Client State"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-03-01"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "state-management"]
supersedes: ""
superseded_by: ""
---

# ADR-0021: TanStack Query for Server State, Zustand for Client State

## Status

**Accepted (retroactively documented 2026-05-30)** — specified in
`docs/system-design.md` §2.2 (Appendix B Decision #12); consumed by the apps and
`@repo/services` (ADR-0019).

## Context

The admin app is data-heavy: lists of timelines/events/characters, dashboard
metrics (ADR-0013), relationship networks, and forms. It also has purely local UI
state (sidebar open/closed, editor draft state, selected era in a temporal input).
Conflating remote/cached data with local UI state in one store leads to manual
cache-invalidation and stale-data bugs.

## Decision

Split state by origin:

- **TanStack Query** owns **server state** — fetching, caching, background
  refetch, and invalidation of everything that comes from Supabase/PostgREST and
  the read functions (ADR-0012/0013). Mutations invalidate the relevant query
  keys.
- **Zustand** owns **client/UI state** — ephemeral, local-only state (shell
  layout, modal/sheet state, in-progress editor selections) that never needs
  caching or server reconciliation.

The boundary rule: if a value originates from or must be reconciled with the
database, it is a Query; if it is purely UI ephemeral, it is Zustand.

## Consequences

### Positive

- **POS-001**: Caching, dedup, and background refresh come from TanStack Query
  instead of hand-rolled fetch/cache logic.
- **POS-002**: Zustand keeps UI state lightweight without forcing server data
  through a global store.
- **POS-003**: A clear origin-based rule prevents the "everything in one store"
  anti-pattern and the stale-cache bugs that follow.

### Negative

- **NEG-001**: Two state libraries means contributors must know which tool a given
  piece of state belongs in.
- **NEG-002**: Query-key conventions must be disciplined so mutations invalidate
  the right caches; a missed key yields stale UI.

## Alternatives Considered

### A single global store (Redux/Zustand) for everything

- **ALT-001**: **Description**: Put server data and UI state in one store.
- **ALT-002**: **Rejection Reason**: Re-implements caching/refetch/invalidation
  that TanStack Query already solves; couples remote and local concerns.

### Server data via React Context + manual fetch

- **ALT-003**: **Description**: Fetch in effects and hold results in context.
- **ALT-004**: **Rejection Reason**: No caching/dedup/background refetch; reinvents
  TanStack Query poorly.

## Implementation Notes

- **IMP-001**: Query client/provider wired in the admin app
  (`apps/admin/app/providers.tsx`); query hooks call `@repo/services` modules
  (ADR-0019).
- **IMP-002**: Dashboard metric badges consume `get_user_metrics` /
  `get_user_recent_counts` via Query (ADR-0013).
- **IMP-003**: Zustand stores hold shell/editor UI state only.

## References

- **REF-001**: ADR-0012/0013 (data sources behind Query), ADR-0019 (service
  modules), ADR-0020 (UI consuming state)
- **REF-002**: `docs/system-design.md` §2.2; `apps/admin/app/providers.tsx`
- **REF-003**: TanStack Query, Zustand docs

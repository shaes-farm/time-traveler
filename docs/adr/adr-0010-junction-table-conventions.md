---
title: "ADR-0010: Junction Table Conventions — Composite PK, No Surrogate id, No user_id"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "junction-tables", "rls"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0010: Junction Table Conventions — Composite PK, No Surrogate id, No user_id

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00002_relationships_junctions.sql` (2026-05-21), with the
single-primary refinement in `00013_character_media_single_primary.sql`
(2026-05-24, #125). Specified in `docs/system-design.md` §3.4.

## Context

The schema has eleven many-to-many junctions (`event_categories`, `event_media`,
`event_characters`, `timeline_events`, `period_timelines`, `story_periods`,
`story_characters`, `story_events`, `character_media`, `timeline_media`, and the
collaborator table). A prior schema put a surrogate `id` and a `user_id` on every
junction for RLS — but a junction `user_id` can disagree with the parent entity's
owner, creating an integrity/authorization hole (a user inserts a junction row
with their own `user_id` pointing at someone else's entities).

## Decision

Standardize all junction tables on:

- **Composite primary key** of the two (or more) FK columns; **no surrogate
  `id`**.
- **No `user_id`** — ownership is derived from the parent entity in RLS
  (ADR-0014, `docs/system-design.md` §9.2.3). The sole exception is
  `timeline_collaborators`, whose `user_id` _is_ the data (it associates a user
  with a timeline).
- **`ON DELETE CASCADE`** on every FK, so deleting a parent removes its junction
  rows without manual cleanup (ADR-0012).
- **`sort_order INTEGER`** where editorial ordering matters (`event_media`,
  `timeline_events` — the latter added in `00012`, #122; `story_events` for
  editorial narrative order was added in `00016`, #183, mirroring `00012`).
- **Deliberate non-junctions**: a many-to-many is only given a junction when the
  link is curated. Periods have **no `period_events`** junction — period↔event
  membership is computed by date, not stored (ADR-0028).
- **Single-primary flag** enforced with a **partial unique index**, not a trigger
  or app check: `CREATE UNIQUE INDEX … (group_col) WHERE is_primary = true`
  (applied to `character_media` in `00013`, #125).

## Consequences

### Positive

- **POS-001**: Removes the junction-`user_id`-vs-parent-owner integrity hole;
  authorization has a single source (the parent entity).
- **POS-002**: Composite PKs are the natural uniqueness constraint for an edge and
  give a free index on the leading column.
- **POS-003**: `ON DELETE CASCADE` eliminates manual junction-cleanup code/stored
  procedures (ADR-0012).
- **POS-004**: The partial-unique-index pattern enforces "one primary per group"
  declaratively, with no trigger to maintain.

### Negative

- **NEG-001**: Junction RLS policies are slightly more complex — each must
  `EXISTS`-check ownership of its parent entity (`docs/system-design.md` §9.2.3).
- **NEG-002**: No surrogate `id` means a junction row is referenced by its
  composite key; adding per-row attributes that need their own FK target would
  require revisiting the design.
- **NEG-003**: Reverse-FK lookups need explicit secondary indexes (e.g.,
  `idx_event_chars_char`) since only the leading PK column is indexed for free.

## Alternatives Considered

### Surrogate `id` + `user_id` on every junction (the prior schema)

- **ALT-001**: **Description**: Each junction has its own `id` PK and a `user_id`
  for RLS.
- **ALT-002**: **Rejection Reason**: `user_id` can diverge from the parent owner
  (integrity/authorization hole); the surrogate `id` adds an index with no benefit
  over the composite key.

### Trigger/app-enforced single-primary

- **ALT-003**: **Description**: Enforce "one primary media per character" with a
  `BEFORE INSERT/UPDATE` trigger or service-layer check.
- **ALT-004**: **Rejection Reason**: A partial unique index is atomic,
  race-free, and declarative; triggers and app checks are more code and can be
  bypassed (`00013`).

## Implementation Notes

- **IMP-001**: All eleven junctions defined in `00002`; `timeline_events.sort_order`
  added in `00012`; `character_media_one_primary` partial unique index in `00013`;
  `story_events.sort_order` (editorial narrative order) added in `00016` (#183).
- **IMP-002**: Reverse-FK indexes (`idx_event_chars_char`,
  `idx_timeline_events_event`, …) in `00005` (`docs/system-design.md` §8.1).
- **IMP-003**: New junctions must follow this pattern; if `event_media`/
  `timeline_media` later gain a primary flag, reuse the partial-unique-index
  recipe (`docs/system-design.md` §3.4).

## References

- **REF-001**: ADR-0011 (CASCADE/publication), ADR-0012 (cascades replace
  delete procedures), ADR-0014 (parent-derived junction RLS), ADR-0015 (RLS perf),
  ADR-0028 (`story_events.sort_order`; the deliberate absence of `period_events`)
- **REF-002**: `supabase/migrations/00002_relationships_junctions.sql`,
  `00012_timeline_events_sort_order.sql`, `00016_story_events_sort_order.sql`,
  `00013_character_media_single_primary.sql`; `docs/system-design.md` §3.4, §9.2.3
- **REF-003**: PostgreSQL partial unique index documentation

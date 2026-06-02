---
title: "ADR-0006: Fractal Timeline via Forward detail_timeline_id"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "fractal", "timeline"]
supersedes: "Original event-to-event parent_event_id nesting (never given its own ADR; dropped in migration 00019 per #180)"
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0006: Fractal Timeline via Forward detail_timeline_id

## Status

**Accepted (retroactively documented 2026-05-30)** — the schema is in
`supabase/migrations/00001_initial_schema.sql` (2026-05-21); the forward-only
model and the deprecation of `parent_event_id` are specified in
`docs/system-design.md` §1.2 and §3.2 (issues #177, #180). This ADR
**supersedes** the original event-to-event `parent_event_id` nesting approach.

## Context

Fractal time navigation — zooming seamlessly from billion-year geological scales
to individual seconds — is a defining feature (`docs/system-design.md` §1.2).
The recursion needs a representation that (a) preserves the committed event RLS
model, (b) avoids cross-timeline integrity holes, and (c) keeps each zoom level
to a bounded query.

The initial schema included `events.parent_event_id` (a self-referential FK) for
event-to-event nesting. This conflates two distinct axes — _containment_ (which
timeline shows an event) and _decomposition_ (what an event expands into) — and
permits parent links that cross timeline boundaries, creating RLS and integrity
ambiguity.

## Decision

Make nesting **forward-only** through the timeline: the recursion unit is the
**timeline**, and an event expands into its own sub-timeline via
`events.detail_timeline_id` (`ON DELETE SET NULL`). The hierarchy is
`timeline → events → (event expands into) sub-timeline → events`, recursing on
the timeline. The two event↔timeline axes are kept strictly separate
(`docs/system-design.md` §3.2):

| Mechanism             | Axis          | Meaning                                                          |
| --------------------- | ------------- | ---------------------------------------------------------------- |
| `events.timeline_id`  | containment   | Primary/home timeline — **the RLS source**                       |
| `timeline_events`     | containment   | Additional "also appears in" membership (not RLS)                |
| `detail_timeline_id`  | decomposition | The sub-timeline this event drills into                          |
| ~~`parent_event_id`~~ | decomposition | **Removed (#180)** — tombstoned, then dropped in migration 00019 |

Access flows from the containing timeline _down_ to its events; a sub-timeline's
collaborators never gain access to the parent event through the fractal link.

This rejection is **event-specific**: it is the conflation of containment and
decomposition on `events` that fails. Genuine single-axis containment trees keep
their self-referential parent FK — `periods.parent_period_id` and
`categories.parent_category_id` are retained for exactly this reason
(ADR-0028).

## Consequences

### Positive

- **POS-001**: Event RLS stays keyed on the _containing_ `timeline_id`, never the
  child `detail_timeline_id`, so the fractal feature ships without touching the
  committed `read_events`/`update_events` policies (ADR-0014).
- **POS-002**: Eliminates the cross-timeline parent-link integrity holes that
  `parent_event_id` permitted.
- **POS-003**: Each zoom level is one bounded query (the sub-timeline's events),
  not an unbounded recursive event tree walk.
- **POS-004**: Matches the admin wireframes' information architecture
  (`docs/design/admin/`), which spec the forward drill-down.

### Negative

- **NEG-001**: Decomposition cycles (an event expands into a timeline that
  transitively contains it) are **not** DB-constrained; the service layer must
  reject cycle-closing `detail_timeline_id` assignments (#177,
  `docs/system-design.md` §3.4).
- **NEG-002**: The transition was staged — `detail_timeline_id` was added in
  migration 00017 (#177), then `parent_event_id` was tombstoned in the service
  layer and dropped in migration 00019 (#180). The schema no longer carries the
  backward mechanism.

## Alternatives Considered

### Event-to-event nesting via `parent_event_id` (the original approach — superseded)

- **ALT-001**: **Description**: A self-referential FK on `events` forming a parent
  tree of events.
- **ALT-002**: **Rejection Reason**: Conflates containment with decomposition,
  allows parent links across timelines (RLS/integrity holes), and turns each zoom
  into a recursive tree walk. Superseded by the forward model; dropped in
  migration 00019 (#180).

### Materialized-path / nested-set on events

- **ALT-003**: **Description**: Encode the hierarchy with a path or left/right
  bounds column.
- **ALT-004**: **Rejection Reason**: Heavy write-time maintenance and still
  event-centric; the timeline-as-recursion-unit model fits the product's zoom
  semantics and existing RLS better.

## Implementation Notes

- **IMP-001**: `detail_timeline_id` and `timeline_id` are both
  `ON DELETE SET NULL` to `timelines`; deleting a sub-timeline detaches the
  drill-down rather than cascading into the parent event (§3.2, §3.4).
- **IMP-002**: Reverse-lookup index
  `idx_events_detail_timeline ON events (detail_timeline_id) WHERE detail_timeline_id IS NOT NULL`
  (pending #177) answers "which event details this timeline?".
- **IMP-003**: `parent_event_id`, its self-FK, and `idx_events_parent` were
  confirmed unused and dropped in migration 00019 (#180).

## References

- **REF-001**: ADR-0010 (junction conventions, `timeline_events`),
  ADR-0014 (event RLS keyed on `timeline_id`), ADR-0028 (period/category
  containment hierarchies retain their parent FK)
- **REF-002**: `supabase/migrations/00001_initial_schema.sql`;
  `docs/system-design.md` §1.2, §3.2, §3.4; issues #177, #180
- **REF-003**: `docs/design/admin/` wireframes (forward drill-down IA)

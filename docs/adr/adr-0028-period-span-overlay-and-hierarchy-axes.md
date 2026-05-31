---
title: "ADR-0028: Periods as Span-Overlays; Hierarchical Containment for Periods & Categories"
status: "Accepted"
date: "2026-05-30"
authors: "Time Traveler engineering"
tags:
  ["architecture", "decision", "data-model", "periods", "categories", "stories"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0028: Periods as Span-Overlays; Hierarchical Containment for Periods & Categories

## Status

**Accepted** — resolved while designing the Milestone 7 (Phase 6) stories /
periods / categories surfaces (`docs/design/admin/02-wireframes/` screens 18–24,
issues #58–#64). The structural model is the existing schema
(`supabase/migrations/00001_initial_schema.sql`,
`00002_relationships_junctions.sql`); this ADR records the semantics now made
explicit in `docs/system-design.md` (`period_timelines` and `story_events`
comments) and the screen 23 (period detail) wireframe.

## Context

Milestone 7 brings periods, categories, and stories into the admin UI. The
tables and junctions already exist, but three load-bearing model questions had
no recorded decision and would have been answered ad hoc by the UI:

1. **How does a period relate to events?** A naive reading would add a
   `period_events` junction mirroring `timeline_events`. But periods, timelines,
   and `event_type='period'` events are three different things, and conflating
   them duplicates membership and creates a second curation surface to keep in
   sync.
2. **Do periods and categories nest?** Both have self-referential parent FKs
   (`parent_period_id`, `parent_category_id`) in `00001`. ADR-0006 tombstoned the
   analogous `events.parent_event_id` (#180), so the bare existence of a parent
   FK is not sufficient justification — the decision to keep these needs its own
   rationale to avoid looking like the same anti-pattern.
3. **What is publishable?** Periods and stories carry `published`/`published_at`
   (ADR-0011); categories do not. The UI needs this settled to know which
   surfaces get a publish control.

## Decision

**Periods are span-overlays, not event containers.** A period's only structural
association is `period_timelines` (period ↔ timeline); there is **no**
`period_events` junction (deliberately). Events fall "within" a period **by
date** — `events.sort_order_years BETWEEN` the period's
`sort_order_start`/`sort_order_end` — computed at read time, not linked. This
fixes the information architecture as three distinct mechanisms
(`docs/system-design.md`, `period_timelines` comment):

| Mechanism                        | Relationship to events                      |
| -------------------------------- | ------------------------------------------- |
| Timeline (via `timeline_events`) | **Contains** curated events (membership)    |
| Period (via `period_timelines`)  | **Bands** timelines; gathers events by date |
| `event_type='period'` event      | A **discrete span event** on one timeline   |

**Periods and categories keep hierarchical containment.** `parent_period_id`
(Mesozoic ⊃ Jurassic) and `parent_category_id` (Science ⊃ Physics) are genuine
single-axis containment trees and are retained — in deliberate contrast to the
retired event `parent_event_id` (ADR-0006, #180), which conflated _containment_
with _decomposition_. Cycle prevention is enforced in the service layer for
both (no DB constraint), the same posture ADR-0006 takes for
`detail_timeline_id`.

**Categories are taxonomy, not publishable content.** Categories tag events only
this pass (`event_categories`); they have no `published` column and get no
publish control. Publication (`published`/`published_at`, ADR-0011) applies to
periods and stories.

## Consequences

### Positive

- **POS-001**: One curation surface for event membership (timelines), not two; a
  period's coverage updates automatically as event dates change, with no junction
  to maintain or let drift.
- **POS-002**: The timeline / period / `event_type='period'` distinction is
  explicit, so the UI and future contributors don't re-add a `period_events`
  junction by reflex.
- **POS-003**: Keeping `parent_period_id`/`parent_category_id` matches the real
  domain (geological and topical containment) without reintroducing the
  cross-axis ambiguity that sank `parent_event_id`.
- **POS-004**: Categories stay a lightweight taxonomy (no publish lifecycle,
  RLS, or notification fan-out), reducing surface area.

### Negative

- **NEG-001**: "Events in this period" is a range query, not an index join, so it
  depends on the `sort_order_years` generated columns and their indexes
  (ADR-0005); a period cannot include or exclude an individual event against its
  dates without an `event_type='period'` event or a timeline.
- **NEG-002**: Hierarchy cycles for periods/categories are not DB-constrained;
  the service layer must reject cycle-closing `parent_*_id` assignments, the same
  caveat ADR-0006 NEG-001 carries for `detail_timeline_id`.
- **NEG-003**: Promoting categories to publishable, or attaching them to
  characters/timelines/periods/stories, later requires a migration (a `published`
  column and/or new junctions) and a new ADR.

## Alternatives Considered

### A `period_events` junction (periods contain events directly)

- **ALT-001**: **Description**: Mirror `timeline_events` with a
  `period_events (period_id, event_id)` junction so events are explicitly linked
  to periods.
- **ALT-002**: **Rejection Reason**: Duplicates event membership across a second
  curation surface, drifts from the timeline as date ranges change, and blurs the
  period / timeline / `event_type='period'` distinction. The by-date computation
  is always correct and needs no upkeep.

### Drop the period/category parent FKs (flat, like events post-#180)

- **ALT-003**: **Description**: Treat #180 as a blanket rejection of
  self-referential hierarchy and flatten periods and categories too.
- **ALT-004**: **Rejection Reason**: #180 rejected event nesting because it
  conflated two axes and crossed timeline/RLS boundaries. Period and category
  hierarchies are single-axis containment with no such conflict; flattening them
  would lose genuine domain structure.

### Make categories publishable for symmetry

- **ALT-005**: **Description**: Add `published`/`published_at` to categories so
  every content entity shares the publish model.
- **ALT-006**: **Rejection Reason**: Categories are organizational metadata, not
  audience-facing content; a publish lifecycle adds RLS and notification cost for
  no product need. Revisit via a new ADR if categories ever become curated,
  shareable content.

## Implementation Notes

- **IMP-001**: `period_timelines` and `story_events` junctions in `00002`;
  `periods.parent_period_id` and `categories.parent_category_id` self-FKs
  (`ON DELETE CASCADE`) in `00001`. No `period_events` table exists by design.
- **IMP-002**: Period RLS derives from the timeline via `period_timelines`
  (`00007`, `00011`); a period has no owner column of its own. Category writes
  follow the standard owner-derived pattern (ADR-0014).
- **IMP-003**: Events-in-period is a `sort_order_years BETWEEN
sort_order_start AND sort_order_end` range scan over the period's bands
  (ADR-0005 generated columns); surfaced on the period detail screen (23).
- **IMP-004**: `story_events.sort_order` for **editorial** narrative ordering is
  implemented in migration `00016` (#183) (see ADR-0010); it is orthogonal to
  the by-date period computation here.

## References

- **REF-001**: ADR-0005 (`sort_order_years` generated columns), ADR-0006
  (event nesting via `detail_timeline_id`; `parent_event_id` retired), ADR-0010
  (junction conventions; `story_events.sort_order`), ADR-0011 (publication model;
  categories excluded), ADR-0014 (owner-derived RLS)
- **REF-002**: `supabase/migrations/00001_initial_schema.sql`,
  `00002_relationships_junctions.sql`, `00007_rls_policies.sql`,
  `00016_story_events_sort_order.sql`;
  `docs/system-design.md` (`period_timelines` / `story_events` comments)
- **REF-003**: `docs/design/admin/00-screen-inventory.md` (Milestone 7
  decisions), `docs/design/admin/02-wireframes/21`–`24`; issues #58–#64, #180,
  #183

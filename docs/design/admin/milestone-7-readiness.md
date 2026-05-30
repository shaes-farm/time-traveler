# Milestone 7 (Phase 6) — Implementation Readiness

Status: **ready to begin.** Stories, Categories & Periods (issues #58–#64). The data layer (services, hooks, Zustand stores) already exists, so #58–#61 are verify/harden tickets and #62/#63/#64 are net-new UI. Design lives in [`02-wireframes/`](02-wireframes/) (screens 18–24) and the [screen inventory](00-screen-inventory.md) → "Milestone 7 additions".

## Dependency status

All foundational dependencies are **closed**: #23 (Zod), #24 (TemporalService), #33 (TanStack hooks), #34 (Zustand stores), #38 (app shell).

One **open** schema dependency: **[#183](https://github.com/shaes-farm/time-traveler/issues/183)** — `story_events.sort_order`. It gates only the story drag-to-reorder slice; everything else proceeds today, and story detail falls back to chronological ordering until it lands. Periods and categories need **no** schema changes.

## Per-issue readiness

| Issue                         | Nature        | Wireframe(s) | Ready? | Notes                                                            |
| ----------------------------- | ------------- | ------------ | ------ | ---------------------------------------------------------------- |
| #58 Harden Story service      | verify/harden | 18–20        | ✅     | extend `addEventToStory` for `sort_order` (gated on #183)        |
| #59 Harden Category service   | verify/harden | 24           | ✅     | cycle prevention + delete child policy                           |
| #60 Harden Period service     | verify/harden | 21–23        | ✅     | span-overlay; events-in-range query contract; no `period_events` |
| #61 Verify hooks + stores     | verify/harden | 18–24        | ✅     | story reorder mutation gated on #183                             |
| #62 Build Story CRUD          | build (UI)    | 18, 19, 20   | ✅     | drag-reorder gated on #183 (chronological fallback)              |
| #63 Build Category management | build (UI)    | 24           | ✅     | tree + inspector; reparent + delete policy                       |
| #64 Build Period management   | build (UI)    | 21, 22, 23   | ✅     | overlaid timelines + computed events-in-range                    |

## Suggested pull order

Data-layer hardening first, then UI simplest → richest:

**#58 / #59 / #60 → #61 → #63 → #64 → #62**

Rationale: harden the three services and confirm the hook/store layer before any UI; Categories (#63) is the simplest UI (no temporal, no publish); Periods (#64) adds temporal + hierarchy + overlay; Stories (#62) is richest (narrative ordering) and is the one slice touched by the #183 gate, so it benefits from going last.

## Resolved model decisions (carried into the issues)

- **Story events** are ordered editorially via `story_events.sort_order` ([#183](https://github.com/shaes-farm/time-traveler/issues/183)) — narrative order, incl. non-chronological telling.
- **Periods are span-overlays** — they overlay timelines (`period_timelines`) and gather events **by date** (computed); there is no `period_events` junction. (Timelines contain curated events; an `event_type='period'` event is a discrete span event — three distinct things.)
- **Categories tag events only** this pass (`event_categories`); taxonomy tree with reparent + an explicit delete-child policy; not publishable.
- **`parent_period_id` / `parent_category_id` hierarchies kept** (genuine containment trees), unlike the retired event `parent_event_id` ([#180](https://github.com/shaes-farm/time-traveler/issues/180)); cycle prevention is service-layer.
- **Publish** applies to stories + periods; **no media** surfaces in any M7 screen.

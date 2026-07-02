# 07 — Events List

**Purpose.** The densest list in the admin. Events span billions of years and have the richest metadata. Optimized for temporal scanning and filtering by era.

## Data shown

- Per event: title, temporal range (start–end with era), event_type, importance, participant count, category badges (truncated), drill-down indicator (expands into a sub-timeline), timeline membership, published state
- Total count + filtered count
- Active filter state
- Active sort order

## Primary actions

- Search (by title, summary, detail — backed by `idx_events_search` GIN)
- Filter by `event_type`, importance range, era, timeline, drill-down (expands into a sub-timeline vs. leaf), has-participants, has-media, published
- Sort by `sort_order_years` (default), title, importance, updated_at
- Create new event
- Click row → event detail
- Bulk multi-select for publish/unpublish/delete

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Events                                                  [ + New event ]     │
│  312 total · 48 shown                                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────┐  ┌────────────────┐  │
│  │ ⌕ Search title, summary, detail…                   │  │ Filter         │  │
│  │                                                    │  │                │  │
│  │ ┌────┬────────────────────────┬────────┬───┬─────┐ │  │ Era            │  │
│  │ │    │ Title                  │ Date   │ ★ │ Pub │ │  │ ☐ BYA       1  │  │
│  │ ├────┼────────────────────────┼────────┼───┼─────┤ │  │ ☐ MYA       4  │  │
│  │ │ ⌒  │ Big Bang               │ 14 BYA │ 10│  ✓  │ │  │ ☐ KYA       8  │  │
│  │ │    │ root · cosmological · 0│        │   │     │ │  │ ☐ BCE      31  │  │
│  │ ├────┼────────────────────────┼────────┼───┼─────┤ │  │ ☐ CE      268  │  │
│  │ │ ⌒  │ K-Pg extinction        │ 66 MYA │  9│  ✓  │ │  │                │  │
│  │ │    │ root · destruction · 2 │ ±1M    │   │     │ │  │ Type           │  │
│  │ ├────┼────────────────────────┼────────┼───┼─────┤ │  │ ☐ Milestone 84 │  │
│  │ │ ↳  │ Discovery of polonium  │ 1898   │  8│  ✓  │ │  │ ☐ Discovery 41 │  │
│  │ │    │ Radium research · disc.│        │   │     │ │  │ ☐ Period   29  │  │
│  │ │    │ · 2 chars · physics    │        │   │     │ │  │ ☐ Incident 22  │  │
│  │ ├────┼────────────────────────┼────────┼───┼─────┤ │  │ ☐ Creation 18  │  │
│  │ │ ↳  │ Discovery of radium    │ 1898   │  8│  ─  │ │  │ ☐ Destruct.  9 │  │
│  │ │    │ Radium research · disc.│        │   │draft│ │  │ ☐ Transform. 5 │  │
│  │ │    │ · 2 chars · physics    │        │   │     │ │  │ ☐ Migration  4 │  │
│  │ ├────┼────────────────────────┼────────┼───┼─────┤ │  │ ☐ Conflict  62 │  │
│  │ │ ⌒  │ Curies share Nobel     │ 1903   │  9│  ✓  │ │  │ ☐ Ceremony  11 │  │
│  │ │    │ Physics · ceremony · 3 │        │   │     │ │  │ ☐ Migration 27 │  │
│  │ │    │ chars · nobel, physics │        │   │     │ │  │                │  │
│  │ ├────┼────────────────────────┼────────┼───┼─────┤ │  │ Importance     │  │
│  │ │ ⌒  │ Pierre Curie killed    │ 1906   │ 10│  ✓  │ │  │ [ 1 ●────● 10 ]│  │
│  │ │    │ Curie biography · inc. │        │   │     │ │  │                │  │
│  │ │    │ · 1 char               │        │   │     │ │  │ Timeline       │  │
│  │ └────┴────────────────────────┴────────┴───┴─────┘ │  │ ▾ Any timeline │  │
│  │                                                    │  │                │  │
│  │ ⟨ 1  2  3  …  7  ⟩            Sort: Date ascending▾│  │ Has chars      │  │
│  │                                                    │  │ ☐ Yes     247  │  │
│  │                                                    │  │ ☐ No       65  │  │
│  │                                                    │  │                │  │
│  │                                                    │  │ Status         │  │
│  │                                                    │  │ ☐ Published251 │  │
│  │                                                    │  │ ☐ Draft    61  │  │
│  │                                                    │  │                │  │
│  │                                                    │  │ Clear filters  │  │
│  └────────────────────────────────────────────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Era filter is the most-used filter for this entity.** Pinned to the top of the filter rail. The rail sits to the **right** of the table (after the content it filters) — see the characters list ([03](03-characters-list.md)) and ADR-0035.
2. **Importance filter is a range slider** (1–10), not a multi-select. The schema constrains importance to 1–10; users care about "show me importance 7+", not individual values.
3. **Drill-down indicator in the first column.** `⤵` marks an event that **expands into a sub-timeline** (`detail_timeline_id` is set); blank otherwise. This is the only fractal signal a flat cross-timeline list can carry under the forward model ([#180](https://github.com/shaes-farm/time-traveler/issues/180)) — there is no root/child event nesting anymore. Clicking `⤵` opens that sub-timeline. _(The ASCII mock above still shows the legacy `⌒`/`↳` root/child glyphs; read the column as the `⤵` drill-down marker. Implemented in #45 now that [#177](https://github.com/shaes-farm/time-traveler/issues/177) has landed `detail_timeline_id`; the click target resolves only when the sub-timeline's slug is in the loaded set, otherwise the `⤵` shows as a static indicator.)_
4. **Date column shows uncertainty inline.** "66 MYA ±1M" makes the precision visible without a dedicated column.
5. **Importance shows as a 1–10 number, right-aligned, tabular figures.** Sequential color scale on a single hue (per [03-aesthetic-notes.md](../03-aesthetic-notes.md)). 10 is darkest; 1 is faintest.
6. **Three-line row layout.** Line 1: title. Line 2: timeline + type + participant count. Line 3 (only when present): category badges. Saves horizontal space at the cost of vertical.
7. **Sort default is `sort_order_years` ascending.** Chronological is the natural order for events. The cursor pagination strategy from system-design §8.2 applies here when result sets get large.
8. **No "all eras" parent toggle.** The era filter is checkbox-multi-select. If nothing is checked, all eras are shown. Avoids the "you forgot to filter and got 13 billion years of events" footgun.
9. **Has-chars filter** is the most common refinement when authors are auditing event participation coverage.
10. **Drill-down filter — fractal scope** (Batch 3 decision Q3, reframed for the forward model in [#180](https://github.com/shaes-farm/time-traveler/issues/180)). A 3-state radio in the filter rail between Era and Type: `All` (default) / `Expandable` (`detail_timeline_id IS NOT NULL` — events that open into a sub-timeline) / `Leaf` (`detail_timeline_id IS NULL`). This replaces the former Root-only/Nested-only (`parent_event_id`) control — under forward-only nesting, "is this a top-level event?" is no longer meaningful at the event level (nesting lives on timelines), but "does this event drill down?" is. The `⤵` row indicator (annotation #3) stays visible regardless of filter state. _(Implemented in #45 now that [#177](https://github.com/shaes-farm/time-traveler/issues/177) has landed. The shared `FilterRail` radio renders its neutral option as **"Any"** rather than "All"; the two are semantically identical — no `detail_timeline_id` filter is applied — so the default state reads "Any · Expandable · Leaf" in the running UI.)_
11. **Categories stay on row line 3, not promoted to a column** (Batch 3 decision Q4). Line 3 only renders when categories exist; rows without categories remain 2 lines tall. The events table is the densest in the admin and cannot afford a column claimed by a frequently-empty field.
12. **Status column** shows three states (per PRD §7.11.5; #127 reconciliation): `✓ Published`, `─ draft` for Draft, and `⇄ shared` for events reachable to the user via `timeline_collaborators` (the event belongs to another user's timeline but is visible because the current user collaborates on that timeline). The Shared state is a permission-context marker. Specific colors (green / gray / blue per PRD §7.11.5) and icons applied at fidelity-2 visual design.

## Edge cases

- **Cross-era range queries.** If a user filters era="CE" + era="BCE", they get both. Sort interleaves them via `sort_order_years` (BCE values are negative).
- **Cursor pagination near the boundary.** Reserved future concern; not implemented in this list pass.
- **Empty list.** Empty state: "No events yet. Events are the moments your timelines are built from." Single CTA.
- **Filtered to zero.** Inline empty state: "No events match these filters." + Clear filters link.
- **Very long titles (events table has `title VARCHAR(2000)`).** Truncate with ellipsis at row width; hover shows full title.
- **Loading.** Skeleton rows; filter rail renders immediately.

## Open questions

- Should the importance column visualize the number, or just label it? Tried sparkline-style bars; rejected as too noisy for a dense list. Number only. _(Already-resolved design choice; kept here for the record.)_

> **Resolved (Batch 3):**
>
> - ~~Parent-event filtering (Root/Nested)~~ — **superseded by [#180](https://github.com/shaes-farm/time-traveler/issues/180).** Replaced by the Drill-down filter (`All` / `Expandable` / `Leaf`) keyed on `detail_timeline_id` under the forward fractal model. See annotation #10.
> - Categories column vs. row line 3 — line 3 stays. See annotation #11.
> - Filter-by-participating-character — deferred to the character-detail Events tab; not added to the events-list filter rail. If filter state is URL-encoded for the rail filters that exist, a `?character=<id>` query parameter could carry character filtering as a low-cost side-effect, documented as future polish.

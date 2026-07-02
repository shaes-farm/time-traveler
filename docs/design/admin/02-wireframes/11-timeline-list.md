# 11 — Timelines List

**Purpose.** Find, scan, and triage timelines. A timeline is the primary container authors organize their work around — the entry point into the fractal hierarchy. Optimized for an author who owns a handful to a few dozen timelines and needs to jump to the one they're working in, or spot which ones are still drafts.

## Data shown

- Per timeline: title, `timeline_type` (badge), `visibility` (badge), published state, `updated_at`, event count, collaborator count, temporal span (start–end with era, when set)
- Total count + filtered count
- Sort + filter state

> **Event count and collaborator count are deferred-tolerant** (issue #42 Data Contract). The list renders without them if the count query contract isn't wired yet; when present they show as `· 24 events · 2 collaborators` on row line 2. Treat both as progressive enhancement, not a blocking dependency.

## Primary actions

- Search (by title, summary, detail — backed by `timelines.search_vector` GIN)
- Filter by `visibility` (`private|public|shared`), `timeline_type` (`general|biographical|comparative`), published state
- Sort by `title`, `updated_at` (default), `created_at`
- Create new timeline (top-right + shortcut)
- Click row → timeline detail
- Bulk multi-select for publish/unpublish/delete (mirrors characters/events lists)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Timelines                                             [ + New timeline ]    │
│  14 total · 9 shown                                                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────┐  ┌─────────────────┐ │
│  │ ⌕ Search title, summary, detail…                   │  │ Filter          │ │
│  │                                                    │  │                 │ │
│  │ ┌──┬──────────────────────┬──────────┬──────┬────┐ │  │ Type            │ │
│  │ │  │ Title                │ Type     │ Vis. │Pub │ │  │ ☐ General     8 │ │
│  │ ├──┼──────────────────────┼──────────┼──────┼────┤ │  │ ☐ Biographical 4│ │
│  │ │  │ Curie scientific…    │ Biograph.│ 🌐pub│ ✓  │ │  │ ☐ Comparative 2 │ │
│  │ │  │ 1867–1934 CE · 24 ev…│          │      │    │ │  │                 │ │
│  │ │  │ · 2 collaborators    │          │      │    │ │  │ Visibility      │ │
│  │ ├──┼──────────────────────┼──────────┼──────┼────┤ │  │ ☐ Private     9 │ │
│  │ │  │ Cosmic history       │ General  │ 🌐pub│ ✓  │ │  │ ☐ Public      3 │ │
│  │ │  │ 14 BYA–now · 312 ev… │          │      │    │ │  │ ☐ Shared      2 │ │
│  │ ├──┼──────────────────────┼──────────┼──────┼────┤ │  │                 │ │
│  │ │  │ Origin of life       │ General  │ 🔒prv│ ─  │ │  │ Status          │ │
│  │ │  │ 3.8–3.5 BYA · 9 ev…  │          │      │draft│ │  │ ☐ Published 11 │ │
│  │ ├──┼──────────────────────┼──────────┼──────┼────┤ │  │ ☐ Draft       3 │ │
│  │ │  │ Mesozoic era         │ General  │ 🔒prv│ ─  │ │  │                 │ │
│  │ │  │ 252–66 MYA · 41 ev…  │          │      │draft│ │  │ Clear filters  │ │
│  │ ├──┼──────────────────────┼──────────┼──────┼────┤ │  └─────────────────┘ │
│  │ │  │ Greek mythology      │ General  │ 👥shr│ ✓  │ │                      │
│  │ │  │ cosmos–1200 BCE      │          │      │    │ │                      │
│  │ └──┴──────────────────────┴──────────┴──────┴────┘ │                      │
│  │                                                    │                      │
│  │ ⟨ 1  2  ⟩                       Sort: Updated ▾    │                      │
│  └────────────────────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same right-rail filter pattern** as the characters and events lists ([03](03-characters-list.md), [07](07-events-list.md)) — grouped checkbox sets on the right of the table with per-option counts; OR within a group, AND across groups. Discoverability over novelty: a third list screen is not the place to invent a new filter idiom. See ADR-0035.
2. **`timeline_type` badge** — `general` / `biographical` / `comparative`. Color + label, not color alone (per [03-aesthetic-notes.md](../03-aesthetic-notes.md)). Biographical timelines carry a subject character (see annotation #6).
3. **`visibility` and published are two independent axes — and the list shows both** (issue #42, #48). `visibility` (`private`/`public`/`shared`) controls _who can reach_ the timeline via RLS; `published` controls _whether it is live_. A timeline can be `public` + draft, or `private` + published. The Visibility column uses an icon+label (`🔒 private`, `🌐 public`, `👥 shared`); the Pub column uses the shared publish badge from [16-publish-workflow.md](16-publish-workflow.md). Do **not** collapse these into one column — conflating them is the single most common timeline-model mistake and the schema deliberately separates them.
4. **Two-line row** (the established list pattern). Line 1: title. Line 2: temporal span + event count + collaborator count. Temporal span renders era explicitly for non-CE (`252–66 MYA`, `14 BYA–now`); CE spans render bare years.
5. **Temporal span is derived from `temporal_data` / `end_temporal_data`** on the timeline row, not computed from member events. A timeline's declared span and the range of events it contains can differ; the declared span is what's shown here. (Mismatch surfacing is a timeline-detail concern — see [13-timeline-detail.md](13-timeline-detail.md).)
6. **Biographical timelines** show their `subject_character_id` subject as a chip on line 2 when present (`· about Marie Curie`). Comparative timelines get no special row treatment in this pass.
7. **Sort default is `updated_at` descending** — unlike events (which default to chronological `sort_order_years`), timelines are work surfaces, so "what did I touch last" is the dominant ordering. Title and `created_at` are the alternates.
8. **No "Shared" status conflation.** A timeline reachable via `timeline_collaborators` shows `visibility = shared` (👥) — but that is the visibility axis, distinct from the `⇄ shared` _permission-context_ badge used on the events/characters lists. For timelines, collaborator-reachable rows simply appear in the list with their real visibility; ownership is implied by the presence of owner-only actions (Edit/Delete) on hover/detail. See [14-collaborators.md](14-collaborators.md).
9. **Pagination is offset-based**, page size 20 (issue #42). Filter + sort state is URL-encoded so a refresh preserves the view (acceptance criterion: "URL/query state survives refresh").
10. **List defaults to top-level timelines** (forward fractal model, [#180](https://github.com/shaes-farm/time-traveler/issues/180)). Under forward-only nesting, every event's drill-down mints a sub-timeline — so without this default the master list would fill with nested sub-timelines. The default view shows only **root** timelines: those **not** referenced by any event's `detail_timeline_id`. A filter-rail toggle **"Include sub-timelines"** (off by default) reveals the rest; sub-timeline rows, when shown, carry a `↳ details: [event]` hint linking to the event they expand. The natural way to reach a sub-timeline is by drilling into its event (`⤵`), not by scrolling this list. **Depends on [#177](https://github.com/shaes-farm/time-traveler/issues/177)** (the `detail_timeline_id` column the root/sub partition is computed from); until it lands, all timelines are "root."

## Edge cases

- **Empty list (zero timelines).** Replace the whole panel with an empty state: "No timelines yet. A timeline is the canvas you arrange events on — from a single lifetime to the whole of cosmic history." Single CTA: **New timeline**.
- **Filtered to zero results.** Inline empty state above the table: "No timelines match these filters." + Clear filters link.
- **Timeline with no temporal span set.** `temporal_data` defaults to `'{}'`. Render `—` in the span position rather than a bogus `0`.
- **Very long titles** (`title VARCHAR(2000)`). Truncate with ellipsis at row width; hover reveals full title.
- **Bulk multi-select.** Selecting any row reveals the sticky action bar: `3 selected · [Publish] [Unpublish] [Delete] [Cancel]`. Consistent with the other lists.
- **Loading.** Skeleton rows; filter rail renders immediately.

## Open questions

- **Card/grid view** is explicitly a non-goal for #42 (table only this pass). A gallery view keyed on a timeline cover image becomes worthwhile once `timeline_media` is populated and visual design lands — defer to fidelity-2 / a later pass.
- **Event-count query contract.** Whether the count is a denormalized column, a view, or an N+1 per-row query is a services decision (#42 leaves it deferred). The list must degrade gracefully when the count is absent — designed for above (annotation, row line 2 is optional).

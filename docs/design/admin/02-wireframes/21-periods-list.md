# 21 — Periods List

**Purpose.** Find and triage periods. A period is a **labeled temporal span** — an era/age/epoch — with significance and characteristic tags, **hierarchically nestable** (Mesozoic → Jurassic). The list optimizes for scanning the temporal structure: chronological by default, with nesting visible.

## Data shown

- Per period: title, span (`temporal_data`–`end_temporal_data` with era), `significance`, nesting indicator (parent/child), characteristic tags (truncated), overlaid-timeline count, published state
- Total count + filtered count
- Sort + filter state

## Primary actions

- Search (title — `periods` has **no `search_vector`**, so this is a `title ILIKE` match, not full-text; see annotation #6)
- Filter by `significance` (`low|medium|high|critical`), era, published, nesting (`All` / `Top-level only` / `Nested only`), overlaid timeline
- Sort by `sort_order_start` (default, chronological), title, `significance`, `updated_at`
- Create new period (top-right + shortcut)
- Click row → period detail
- Bulk multi-select for publish/unpublish/delete

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Periods                                                  [ + New period ]   │
│  23 total · 18 shown                                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────┐  ┌─────────────────┐ │
│  │ ⌕ Search by title…                                 │  │ Filter          │ │
│  │                                                    │  │                 │ │
│  │ ┌──┬──────────────────────┬────────────┬─────┐     │  │ Significance    │ │
│  │ │  │ Title                │ Span       │ Sig │     │  │ ☐ Critical    3 │ │
│  │ ├──┼──────────────────────┼────────────┼─────┤     │  │ ☐ High        7 │ │
│  │ │⌒ │ Mesozoic Era         │ 252–66 MYA │ ███ │     │  │ ☐ Medium     10 │ │
│  │ │  │ reptiles · warm      │            │ crit│     │  │ ☐ Low         3 │ │
│  │ ├──┼──────────────────────┼────────────┼─────┤     │  │                 │ │
│  │ │↳ │ Triassic             │ 252–201 MYA│ ██  │     │  │ Show            │ │
│  │ │  │ in Mesozoic Era      │            │ high│     │  │ ◉ All           │ │
│  │ ├──┼──────────────────────┼────────────┼─────┤     │  │ ◯ Top-level     │ │
│  │ │↳ │ Jurassic             │ 201–145 MYA│ ██  │     │  │ ◯ Nested        │ │
│  │ │  │ in Mesozoic Era      │            │ high│     │  │                 │ │
│  │ ├──┼──────────────────────┼────────────┼─────┤     │  │ Era             │ │
│  │ │⌒ │ Industrial Revolution│ 1760–1840  │ ███ │     │  │ ☐ MYA   …       │ │
│  │ │  │ steam · factories    │ CE         │ crit│     │  │ ☐ CE    …       │ │
│  │ └──┴──────────────────────┴────────────┴─────┘     │  │                 │ │
│  │                                                    │  │ Status          │ │
│  │ ⟨ 1  2  ⟩                  Sort: Start date ▾      │  │ ☐ Published  20 │ │
│  │                                                    │  │ ☐ Draft       3 │ │
│  │                                                    │  │ Clear filters   │ │
│  └────────────────────────────────────────────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same right-rail + row pattern** as the other lists — filter rail on the right of the table. Periods read most like the events list — temporally dense, era-aware — so it borrows that layout. See ADR-0035.
2. **Span renders via the finalized `TemporalDisplay`** ([03-aesthetic-notes.md](../03-aesthetic-notes.md) § _Era palette_): era code + hue, era-aware formatting (`252–66 MYA`, `1760–1840 CE`). End is expected for periods (they're closed spans) but the schema allows open (`end_temporal_data` optional) — render a single start with an "open" affordance if unset.
3. **`significance` uses the finalized sequential ramp** ([03-aesthetic-notes.md](../03-aesthetic-notes.md) § _Significance scale_) — the single-hue amber importance ramp reused for `low/medium/high/critical`. Shown as a 4-step bar + label, right-aligned. This is the same visual language as event importance, deliberately.
4. **Nesting indicator + Show filter** mirror the events list's fractal-scope control, but for the **kept** `parent_period_id` hierarchy: `⌒` top-level, `↳` nested (one level of indentation; `in [Parent]` on line 2). `Show: All / Top-level only / Nested only` keys on `parent_period_id IS NULL`. Unlike events (where event-to-event nesting was retired, [#180](https://github.com/shaes-farm/time-traveler/issues/180)), **periods keep `parent_period_id`** — a period genuinely _is_ a span that contains sub-spans (Mesozoic ⊃ Jurassic), which is the natural hierarchy, not a fractal-zoom mechanism.
5. **Characteristic tags** (`characteristics TEXT[]`) render on line 2 when present, like event categories on the events list — descriptive attributes of the span ("reptiles", "warm climate"), not a filterable taxonomy.
6. **Search is title-only.** The `periods` table has no `search_vector` (unlike events/timelines/characters/stories) — so search is a `title ILIKE '%…%'` match. Flagged as a possible future schema addition (a generated `search_vector` over title/summary/detail) if full-text becomes necessary; **not** added this pass.
7. **`StatusBadge`** (Published/Draft) — periods are publishable (`published`/`published_at`). See [16-publish-workflow.md](16-publish-workflow.md).
8. **Sort default is `sort_order_start` ascending** (chronological) — the natural reading order for temporal spans, same rationale as the events list.

## Edge cases

- **Empty list.** Whole-panel empty state: "No periods yet. Periods are the named spans — eras, ages, epochs — your events fall within." Single CTA: **New period**.
- **Filtered to zero.** Inline empty state + Clear filters.
- **Open-ended period** (`end_temporal_data` unset). Render `252 MYA – …` / "ongoing" rather than a bogus end.
- **Deeply nested periods.** One level of indentation only in the list (like events); full ancestry shows on [period detail](23-period-detail.md). Avoids an unbounded tree in a flat list.
- **Loading.** Skeleton rows; filter rail immediate.

## Open questions

- **`periods.search_vector`** — add a generated full-text column for parity with the other entities? Deferred; title-match covers the modest period counts expected. Tier 4.
- **Tree view toggle** — a true expand/collapse tree (like [24-category-management.md](24-category-management.md)) as an alternative to the flat chronological list. Periods are both temporal _and_ hierarchical; the flat-chronological default serves scanning, a tree would serve structure. Documented as a future view option, not built this pass.

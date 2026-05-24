# 03 — Characters List

**Purpose.** Find, scan, and triage characters. Optimized for content authors who have hundreds of characters across types and need to filter, search, and jump to detail quickly.

## Data shown

- Per character: name, character_type (badge), significance, birth/death temporal (compact display), aliases (truncated), participant count in events, primary media thumbnail, published state
- Total count + filtered count
- Sort + filter state

## Primary actions

- Search (by name, alias — backed by `idx_characters_aliases` GIN + `search_vector`)
- Filter by `character_type`, significance, published state, has-media flag
- Sort by name, created, updated, birth date
- Create new character (top-right + shortcut)
- Bulk actions: publish/unpublish, delete (multi-select)
- Click row → character detail

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Characters                                          [ + New character ]     │
│  47 total · 12 shown                                                         │
│                                                                              │
│  ┌─────────────────┐  ┌────────────────────────────────────────────────────┐  │
│  │ Filter          │  │ ⌕ Search by name or alias…                         │  │
│  │                 │  │                                                    │  │
│  │ Type            │  │ ┌──┬────────────────┬────────┬─────────────┬─────┐ │  │
│  │ ☐ Human    23  │  │ │  │ Name           │ Type   │ Temporal    │ Pub │ │  │
│  │ ☐ Animal    4  │  │ ├──┼────────────────┼────────┼─────────────┼─────┤ │  │
│  │ ☐ Myth.     7  │  │ │● │ Marie Curie    │ Human  │ 1867–1934   │  ✓  │ │  │
│  │ ☐ Fictional 3  │  │ │  │ ↳ M. Skłod… +1 │ ★★★★ │ CE          │     │ │  │
│  │ ☐ Organiz.  5  │  │ │  │ 12 events · ⌶  │        │             │     │ │  │
│  │ ☐ Divine    2  │  │ ├──┼────────────────┼────────┼─────────────┼─────┤ │  │
│  │ ☐ Artifact  3  │  │ │● │ Pierre Curie   │ Human  │ 1859–1906   │  ✓  │ │  │
│  │                 │  │ │  │ 8 events · ⌶  │ ★★★★   │ CE        │     │ │  │
│  │ Significance    │  │ ├──┼────────────────┼────────┼─────────────┼─────┤ │  │
│  │ ☐ Critical  4  │  │ │● │ Antoine Bec…   │ Human  │ 1852–1908   │  ─   │ │  │
│  │ ☐ High     11  │  │ │  │ 3 events       │ ★★★    │ CE         │ draft│ │  │
│  │ ☐ Medium   22  │  │ ├──┼────────────────┼─────────┼─────────────┼─────┤ │  │
│  │ ☐ Low      10  │  │ │● │ Tyrannosaurus  │ Animal │ 68–66 MYA   │  ✓  │ │  │
│  │                │  │ │  │ rex            │ ★★★★★  │ approximate │     │ │  │
│  │ Status         │  │ │  │ 1 event        │         │             │     │ │  │
│  │ ☐ Published 38 │  │ ├──┼────────────────┼────────┼─────────────┼─────┤ │  │
│  │ ☐ Draft      9 │  │ │● │ Zeus           │ Divine │ —           │  ✓  │ │  │
│  │                │  │ │  │ "Jupiter" +3   │ ★★★★  │             │     │ │  │
│  │ Has media      │  │ │  │ 22 events · ⌶  │        │             │     │ │  │
│  │ ☐ Yes      31  │  │ └──┴────────────────┴────────┴─────────────┴─────┘ │  │
│  │ ☐ No       16  │  │                                                    │  │
│  │                │  │ ⟨ 1  2  3  4  ⟩                       Sort: Name ▾  │  │
│  │ Clear filters  │  │                                                    │  │
│  └────────────────┘  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Left-rail filters with grouped counts.** Each filter group is a checkbox set with per-option counts. Multiple selections within a group are OR; across groups are AND. This is conventional and discoverable.
2. **Type badges should be visually distinct.** Color + label, not color alone. See [03-aesthetic-notes.md](../03-aesthetic-notes.md).
3. **Row layout includes secondary info (aliases, event count) indented under the primary line.** This is the "two-line row" pattern from Linear/Notion lists. Saves columns without losing scanability.
4. **Star icons (★) encode significance** — not a literal rating, just a sequential signal (low/medium/high/critical). The same `★★★★★` glyph means "critical" regardless of context.
5. **Temporal column shows era when non-CE.** "1867–1934" is CE by convention (modern); "68–66 MYA approximate" makes the era + precision explicit. For divine/mythological characters with no birth/death, render `—`.
6. **Participant count + 🔗 indicator (drawn as `⌶`)** shows characters that appear in many events. Useful for finding central figures.
7. **Published column** uses ✓ for published, `─ draft` for unpublished. Trying to make draft state subtly visible without screaming.
8. **Pagination is offset-based for now**, with sort selector on the right. Cursor pagination on `sort_order_years` is in system-design §8.2 but the characters table doesn't have that column (only events does). Sort here uses standard ordering.
9. **Search hits aliases.** The `search_vector` includes name + biography + aliases (per migration 00001). Aliases also have a dedicated GIN index for exact array containment.
10. **Primary media thumbnail surfaces on hover** (Batch 3 decision Q1). The row does not have a dedicated thumbnail column — too many media-less rows would have empty cells. Hovering the name reveals a small card showing the primary `character_media` image (or a type-icon placeholder for characters without media). The `has_media` filter is the deliberate discovery affordance for "characters that still need a portrait" (Batch 3 decision Q2).

## Edge cases

- **Empty list (zero characters).** Replace the whole panel with an empty state: "No characters yet. Characters are the people, beings, and organizations that participate in your events." Single CTA.
- **Filtered to zero results.** Inline empty state above the table: "No characters match these filters. Clear filters."
- **Long alias lists.** Truncate at 1 visible alias + count (`+3`). Hover reveals the full list.
- **Bulk multi-select.** Selecting any row reveals a sticky action bar at the bottom: `3 selected · [Publish] [Unpublish] [Delete] [Cancel]`. Mirrors Linear/Notion.
- **Loading.** Skeleton rows in the table; filters render immediately.

## Open questions

> **Resolved (Batch 1):** Type filter icons + labels — labels only this fidelity pass. Iconography deferred to the visual-design step (next fidelity).
>
> **Resolved (Batch 3):**
>
> - Per-row primary media thumbnail — hover-card on the name row; no dedicated column. See annotation #10.
> - `has_media` filter — kept; "characters that still need a portrait" is a real recurring use case for content authors.

_All initial open questions resolved. Future questions may be added as the wireframe is refined._

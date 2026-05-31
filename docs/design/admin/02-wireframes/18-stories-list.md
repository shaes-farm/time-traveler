# 18 — Stories List

**Purpose.** Find and triage stories. A story is a **narrative layer over events** — not a container of data but an interpretation of it, with a perspective and a cast. Authors here are writers managing several tellings; the list optimizes for "which story was I writing" and "what's still a draft."

## Data shown

- Per story: title, `sub_title`, `narrator_type`, perspective character (with type identity), event count, character count, tags (truncated), published state, `updated_at`
- Total count + filtered count
- Sort + filter state

## Primary actions

- Search (title, sub_title, summary, detail — backed by `stories.search_vector` GIN)
- Filter by `narrator_type` (`first_person|third_person|omniscient`), published state, tag, perspective character
- Sort by `title`, `updated_at` (default), `created_at`
- Create new story (top-right + shortcut)
- Click row → story detail
- Bulk multi-select for publish/unpublish/delete

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Stories                                                  [ + New story ]    │
│  9 total · 6 shown                                                           │
│                                                                              │
│  ┌─────────────────┐  ┌────────────────────────────────────────────────────┐  │
│  │ Filter          │  │ ⌕ Search title, summary, detail…                   │  │
│  │                 │  │                                                    │  │
│  │ Narrator        │  │ ┌──────────────────────────┬───────────┬────┐     │  │
│  │ ☐ First-person 3│  │ │ Title                    │ Narrator  │Pub │     │  │
│  │ ☐ Third-person 4│  │ ├──────────────────────────┼───────────┼────┤     │  │
│  │ ☐ Omniscient  2 │  │ │ The Curies' Quest        │ 3rd-person│ ✓  │     │  │
│  │                 │  │ │ A radium love story      │           │    │     │  │
│  │ Perspective     │  │ │ 👤 Marie Curie · 8 ev·3ch│           │    │     │  │
│  │ ▾ Any character │  │ ├──────────────────────────┼───────────┼────┤     │  │
│  │                 │  │ │ Fall of Rome             │ Omniscient│ ✓  │     │  │
│  │ Status          │  │ │ 14 ev · 9 ch             │           │    │     │  │
│  │ ☐ Published   6 │  │ │ tragedy · war            │           │    │     │  │
│  │ ☐ Draft       3 │  │ ├──────────────────────────┼───────────┼────┤     │  │
│  │                 │  │ │ My Grandfather's War     │ 1st-person│ ─  │     │  │
│  │ Tags            │  │ │ 👤 Étienne (narrator)    │           │draft│    │  │
│  │ [ war ×]        │  │ │ 5 ev · 2 ch              │           │    │     │  │
│  │ [ + tag ]       │  │ └──────────────────────────┴───────────┴────┘     │  │
│  │                 │  │                                                    │  │
│  │ Clear filters   │  │ ⟨ 1  ⟩                          Sort: Updated ▾    │  │
│  └─────────────────┘  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same left-rail + two-line-row list pattern** as characters/events/timelines ([03](03-characters-list.md), [07](07-events-list.md), [11](11-timeline-list.md)). Don't reinvent a fourth list idiom.
2. **`narrator_type` is a column + filter**, three values (`first_person|third_person|omniscient`). It's identity-level for a story (the narrative voice), so it sits beside the title like character_type does for characters.
3. **Perspective character renders with the finalized type identity** — the `perspective_character_id` shows as `👤 Name` using the character-type icon + tint from [03-aesthetic-notes.md](../03-aesthetic-notes.md) § _Character type as identity_. For `first_person` stories it carries a `(narrator)` qualifier. Stories with no perspective character (common for omniscient) omit the chip.
4. **Counts on line 2** — `N ev · M ch` (events via `story_events`, characters via `story_characters`). Deferred-tolerant like the timelines list: render without them if the count contract isn't wired.
5. **Tags** (the `tags TEXT[]` column) render on line 3 when present, and double as a filter (chip-input in the rail). Tags are free-form (genre/thematic/geographic per PRD §4.6.6), distinct from Categories (which don't attach to stories — see [24-category-management.md](24-category-management.md)).
6. **Status uses the finalized `StatusBadge`** (Published ✓ emerald / Draft ─ zinc / Shared ⇄ blue) — stories are publishable (`published`/`published_at`). See [16-publish-workflow.md](16-publish-workflow.md) and [03-aesthetic-notes.md](../03-aesthetic-notes.md) § _Status badges_.
7. **Sort default is `updated_at` desc** — stories are work surfaces (like timelines), so "what I touched last" wins over alphabetical.
8. **No temporal column.** A story has no intrinsic date — its temporal footprint is derived from the events/periods it references. Surfacing a computed span here is deferred (Open Questions); the detail page is where temporal context lives.

## Edge cases

- **Empty list (zero stories).** Whole-panel empty state: "No stories yet. A story is a telling — your interpretation of events, from a point of view." Single CTA: **New story**.
- **Filtered to zero.** Inline empty state + Clear filters.
- **Story with no events/characters yet.** Counts render `0 ev · 0 ch`; the row is still valid (a story can be drafted before it's populated).
- **Long titles / many tags.** Truncate title at row width (hover for full); tags truncate to 2 + `+N`.
- **Bulk multi-select.** Sticky action bar: `2 selected · [Publish] [Unpublish] [Delete] [Cancel]`.
- **Loading.** Skeleton rows; filter rail renders immediately.

## Open questions

- **Computed temporal span column** (min–max of referenced events' `sort_order_years`). Useful for scanning, but adds a per-row aggregate query; deferred until the count contract proves cheap. Tier 4.
- **Filter by referenced event/character** — a `?character=` / `?event=` query param could drive "stories featuring X" without a rail control, mirroring the events-list deferral. Documented as future polish.

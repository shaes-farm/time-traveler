# 20 — Story Detail

**Purpose.** Read + manage a single story. This is the authoring workspace where a story becomes a _telling_: the narrative prose, the **ordered sequence of events** (the heart of it), the cast with their roles, and the periods it spans. The event-ordering surface is why associations live here, not in the editor.

## Data shown

- Identity: title, sub_title, slug, `narrator_type`, perspective character (type identity)
- Narrative: summary, detail (rendered Markdown)
- `published` state, timestamps, tags
- **Events** in narrative order (`story_events` + `sort_order`, [#183](https://github.com/shaes-farm/time-traveler/issues/183))
- **Characters** with `role_in_story` (`story_characters`)
- **Periods** the story spans (`story_periods`)

## Primary actions

- Edit story (→ [19-story-editor.md](19-story-editor.md))
- Publish / unpublish (header; owner-only — [16-publish-workflow.md](16-publish-workflow.md))
- Delete (danger zone)
- Add / reorder / remove events; add / re-role / remove characters; add / remove periods
- Navigate to an event, character, or period

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Stories ▸ The Curies' Quest                         [Edit] [✓ Published ▾]   │
│                                                                              │
│  The Curies' Quest                                                           │
│  A radium love story                                                         │
│  Third-person · through 👤 Marie Curie · ✓ Published                         │
│                                                                              │
│  Summary                                                                     │
│  ────────────────────────────────────────────────────────────────────────  │
│  How two scientists turned grief and pitchblende into two Nobel Prizes.      │
│                                                                              │
│  ┌── Events (8) ──┬── Characters (3) ──┬── Periods (1) ──┐                   │
│  ╞════════════════╧════════════════════╧═════════════════╡                   │
│  │                                          [ + Add event ]                 │ │
│  │  Narrative order · drag ⠿ to reorder                                     │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │  ⠿ 1  1891 CE  Sklodowska arrives in Paris        milestone   ★7        │ │
│  │  ⠿ 2  1895 CE  Marriage to Pierre Curie           ceremony    ★6        │ │
│  │  ⠿ 3  1898 CE  Discovery of polonium              discovery   ★8        │ │
│  │  ⠿ 4  1903 CE  Curies share Nobel in Physics      ceremony    ★9        │ │
│  │  ⠿ 5  1906 CE  Pierre Curie killed                incident    ★10       │ │
│  │  ⠿ 6  1891 CE  (flashback) Leaving Poland         milestone   ★5    [×] │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │  8 events · narrative order (story_events.sort_order)                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ▸ Danger zone                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Header mirrors the other detail headers** ([08](08-event-detail.md)/[13](13-timeline-detail.md)): breadcrumb, title + `sub_title`, a voice metadata line (`narrator_type · through [perspective character]`), and `[Edit] [Publish ▾] [⋯]`. Perspective character uses the finalized type identity ([03-aesthetic-notes.md](../03-aesthetic-notes.md) § "Character type as identity"). Publish is the canonical owner-only control ([16-publish-workflow.md](16-publish-workflow.md)).
2. **Rendered Markdown narrative** — `summary` then `detail`. This is the one detail page where prose dominates the overview; metadata is thin (it's all in the header).
3. **Events tab is the centerpiece and is explicitly _ordered_.** Unlike the timeline detail Events tab (chronological by default), a story's events render in **narrative order** via `story_events.sort_order` ([#183](https://github.com/shaes-farm/time-traveler/issues/183)). The order index (`1, 2, 3…`) is shown, and the chronological date is shown alongside — so a **flashback reads as order-6 but dated 1891**, making non-chronological telling legible. Drag the `⠿` handle to reorder (rewrites `sort_order`).
   - **Blocked on [#183](https://github.com/shaes-farm/time-traveler/issues/183):** until `story_events.sort_order` lands, events render chronologically (by `events.sort_order_years`), the order index and `⠿` drag handle are hidden, and the footer note reads "chronological (narrative ordering pending #183)."
4. **`[ + Add event ]`** opens a searchable combobox over the user's events (same command-palette pattern as the timeline link-event picker, [13](13-timeline-detail.md) annotation #6). Adding inserts a `story_events` row at the end (`max(sort_order)+1`). Events keep their own home timeline and identity — a story _references_ events, it doesn't own them (an event can appear in many stories, PRD §4.6.3).
5. **Event rows are read-mostly references** — date, type, importance (finalized importance ramp + era/`TemporalDisplay` per [03-aesthetic-notes.md](../03-aesthetic-notes.md)). `[×]` removes only the `story_events` link (the event is untouched). Clicking the title navigates to the event.
6. **Characters tab — roles, not ordering.** `story_characters` with `role_in_story` (`protagonist|supporting|mentioned|narrator`). Each row: character (type identity) + an inline role select. Multiple characters can share a role (PRD §4.6.5). The `narrator` role pairs with first-person voice. `[ + Add character ]` opens a character picker.
7. **Periods tab — span associations.** `story_periods` links the story to the eras it spans ("Age of Exploration" story ↔ "15th–17th Century Exploration" period, PRD §4.6.4). Simple add/remove (no ordering, no roles). Each period shows its span via `TemporalDisplay`. Links to [period detail](23-period-detail.md).
8. **No media tab.** Stories have no `story_media` junction — media doesn't attach to stories this pass. (Media lives on events/characters/timelines via the [media library](17-media-library.md).)
9. **Tabs lazy-load**; counts in labels.

## Tab variations

### Characters tab

```
  Characters (3)                                       [ + Add character ]
  ───────────────────────────────────────────────────────────────────────
  👤 Marie Curie       protagonist ▾                                  [×]
  👤 Pierre Curie      protagonist ▾                                  [×]
  👤 Henri Becquerel   supporting  ▾                                  [×]
```

### Periods tab

```
  Periods (1)                                          [ + Add period ]
  ───────────────────────────────────────────────────────────────────────
  ◷ Belle Époque   1871–1914 CE                                       [×]
```

## Edge cases

- **404 / not found.** Lookup by `(user_id, slug)`; unresolved slug → 404 with link back to the stories list.
- **Empty Events tab.** "No events in this story yet. A story is the order you tell them in." Single CTA (Add event).
- **No characters / no periods.** Per-tab empty state with the add CTA.
- **Reorder while #183 is open.** Reordering is disabled (no `sort_order`); the footer explains why and links #183.
- **Removing a character with the `narrator` role on a first-person story.** Soft warning: "This is the narrator of a first-person story." Non-blocking (the perspective character on the story row is the canonical voice; this is a cast role).
- **Permissions.** Stories are owner-scoped (no `timeline_collaborators` path); standard owner-or-admin edit/delete, read-only for others on published stories.
- **Loading.** Skeleton header; tabs lazy-load with per-tab skeletons.

## Open questions

- **Reorder granularity** (#183 follow-up) — whether drag rewrites one row's `sort_order` or renumbers the set (sparse vs. dense). Fidelity-2 interaction detail.
- **Story "reading" preview** — a read-only narrative view stitching `detail` + ordered events. That's closer to the public reader (out of admin scope); deferred.
- **Bulk add events** (multi-select in the picker) — deferred, consistent with the timeline-detail bulk-link deferral.

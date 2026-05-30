# 08 — Event Detail

**Purpose.** Read view of a single event. Surfaces temporal context, fractal lineage, participating characters, and attached media. Entry point for editing and for navigating to related entities.

## Data shown

- Identity: title, slug, event_type
- Narrative: summary, detail
- Temporal: temporal_data, end_temporal_data (range), computed durations
- Location: location string, spatial_data (lat/lng — defer visualization)
- Importance (1–10)
- Timelines (the fractal axis): containing timelines — home (`timeline_id`) + guest appearances (`timeline_events`); the drill-down sub-timeline this event **expands into** (`detail_timeline_id` — see [#177](https://github.com/shaes-farm/time-traveler/issues/177)); and chronological neighbors within the home timeline
- ~~Fractal: parent_event_id (breadcrumb), child events~~ — **removed.** Event-to-event nesting is retired; the fractal hierarchy is expressed forward via `detail_timeline_id` → sub-timeline → events (see [#180](https://github.com/shaes-farm/time-traveler/issues/180))
- Participating characters (`event_characters` joined)
- Categories (`event_categories` joined)
- Attached media (`event_media` joined, ordered by `sort_order`)
- Published state, timestamps

## Primary actions

- Edit event
- Publish / unpublish
- Delete (danger zone)
- Add participant
- Attach media
- Navigate to a containing timeline / the sub-timeline it expands into / a nearby event / participating character

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Curie biography ▸ Discovery of polonium                                     │
│                                                          [Edit] [Publish ✓]  │
│                                                                              │
│  Discovery of polonium                                                       │
│  Discovery · Importance 8 / 10                                               │
│                                                                              │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Summary                            │  Temporal                        │  │
│  │  ───────────────────────────────    │  ───────────────────────────     │  │
│  │  Marie and Pierre Curie isolate     │  Date    July 1898 CE (exact)    │  │
│  │  polonium from pitchblende ore,     │  Range   point event             │  │
│  │  naming it after Marie's homeland.  │                                  │  │
│  │                                     │  Location                        │  │
│  │  Detail                             │  ───────────────────────────     │  │
│  │  ───────────────────────────────    │  Paris, France                   │  │
│  │  [ full long-form detail … ]        │  48.86° N · 2.35° E              │  │
│  │                                     │                                  │  │
│  │                                     │  Timelines                       │  │
│  │                                     │  ───────────────────────────     │  │
│  │                                     │  Contained in                    │  │
│  │                                     │  • Curie biography      (home)   │  │
│  │                                     │  • Women in science     (guest)  │  │
│  │                                     │                                  │  │
│  │                                     │  Expands into ⤵                  │  │
│  │                                     │  Marie's lab years               │  │
│  │                                     │    sub-timeline · 6 events       │  │
│  │                                     │                                  │  │
│  │                                     │  Nearby in Curie biography       │  │
│  │                                     │  ↞ Marriage to Pierre · 1895     │  │
│  │                                     │  ↠ Curies share Nobel  · 1903    │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
│                                                                              │
│  ┌── Participants (2) ──┬── Categories (2) ──┬── Media (1) ──┐               │
│  ╞══════════════════════╧════════════════════╧═══════════════╡               │
│  │                                                           │               │
│  │  [photo] Marie Curie       protagonist · primary  [Edit]  │               │
│  │  [photo] Pierre Curie      protagonist · primary  [Edit]  │               │
│  │                                                           │               │
│  │  [ + Add participant ]                                    │               │
│  └───────────────────────────────────────────────────────────┘               │
│                                                                              │
│  ▸ Danger zone                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Breadcrumb is timeline-rooted**, not event-lineage-rooted: `[containing timeline] ▸ [this event]`. Under the forward fractal model ([#180](https://github.com/shaes-farm/time-traveler/issues/180)) "up" from an event is its containing timeline, not a parent event. When the event is reached from the flat events list, the breadcrumb falls back to `Events ▸ [this event]`. Navigating further up the fractal (timeline → the event that expands into it) happens from the [timeline detail](13-timeline-detail.md) header, not here.
2. **Two-column overview.** Left: narrative content (summary, detail). Right: structured metadata (temporal, location, timelines/fractal). Right column is fixed-width and doesn't scroll.
3. **Importance is in the header, near the type.** Both are categorical identifiers of the event.
4. **Temporal block shows the era explicitly.** "July 1898 CE (exact)" not "July 1898". For MYA/KYA events, era + precision dominate.
5. **Range vs. point.** If `end_temporal_data` is null, render "point event". If present, render "1895–1898 CE" with the inferred duration. **Duration is always shown** with era-aware formatting (Batch 4 decision Q3): CE/BCE renders "lived 66 years" or "spans 300 years"; KYA renders "spans 4,000 years"; MYA renders "spans 79 million years"; BYA rounds to significant digits. **A visual range bar renders only when** uncertainty > 100 years OR the range spans > 1000 years OR the range crosses an era boundary (Batch 4 decision Q2) — trivial CE ranges get no bar; "66 MYA ±1M" or "12 KYA – 8 KYA" get one. Exact thresholds and visual treatment refined at the next fidelity step.
6. **Timelines section is the fractal navigation surface** (forward model, [#180](https://github.com/shaes-farm/time-traveler/issues/180)). It has three parts: **Contained in** (the timelines this event belongs to — home + guests), **Expands into** (the sub-timeline it decomposes into, the zoom-in direction), and **Nearby in timeline** (chronological neighbors). There is no parent/child-event lineage — event-to-event nesting is retired; you traverse the hierarchy by entering timelines, not by walking a parent_event_id tree.
7. **"Nearby in timeline"** replaces the old sibling-events affordance and answers the same question — "what else happened around here?" — but grounded in **home-timeline membership + chronological proximity** rather than a shared parent. Show the nearest event on each side (`↞` earlier, `↠` later) by `ABS(this.sort_order_years − neighbor.sort_order_years)`; "see all" opens the home [timeline detail](13-timeline-detail.md). When the event has no home timeline, this section is omitted.
8. **Tabs below for the junction data.** Participants is the most active tab; Categories and Media are simpler.
9. **Participant rows show role + significance** as labels, not icons. The 11 roles are too many to encode with glyphs.
10. **Per-participant edit action** opens the inline participant editor (a sheet) — it edits only that one row.
11. **Spatial data** has a lat/lng pair shown as text. No map embed in this pass. Out of scope, but the data is there.
12. **Media per-item actions live in an overflow menu** (`⋯`) — Edit caption, Reorder, Detach (Batch 4 decision Q4). Always-visible inline buttons clutter at scale and none of these actions are frequent enough to claim per-row space. Standard admin-tool pattern.
13. **The three timeline relationships in the Timelines section** (forward fractal model; see [09-event-editor.md](09-event-editor.md) annotation #15, [13-timeline-detail.md](13-timeline-detail.md), and [#177](https://github.com/shaes-farm/time-traveler/issues/177)):
    - **Contained in → home** (`timeline_id`) — the event's home/containing timeline; the RLS source. Links to that [timeline detail](13-timeline-detail.md).
    - **Contained in → guest** (`timeline_events`) — additional timelines the event appears in (e.g. comparative); each links out.
    - **Expands into `⤵`** (`detail_timeline_id`) — the fractal drill-down sub-timeline; the `⤵` affordance is the "zoom in" navigation into that sub-timeline (the inverse of [13-timeline-detail.md](13-timeline-detail.md)'s "Details the event" header line). This is the **only** decomposition mechanism — event-to-event nesting (`parent_event_id`) is retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)). **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177)** — the Expands-into row is hidden until the column lands.

## Tab variations

### Categories tab

```
  Categories                                        [ + Add category ]
  ───────────────────────────────────────────────────────────────────
  ◯ Physics    ◯ Discovery
```

Categories are simple tags. Removal is `×` per chip. Add opens a multi-select dropdown.

### Media tab

```
  Media (1)                                         [ + Attach media ]
  ───────────────────────────────────────────────────────────────────
  ╔════════════════╗
  ║                ║   First page of the Curies' polonium discovery paper
  ║   [thumbnail]  ║   sort_order: 0                          [⋯]
  ║                ║
  ╚════════════════╝
```

Media in `event_media` has `sort_order` for explicit ordering. Drag to reorder.

## Edge cases

- **No participants / no media / no categories.** Each tab shows an empty state with the add CTA.
- **Event that expands into nothing (leaf).** The Timelines section omits the "Expands into" subsection; no `⤵`. The event is a leaf of the fractal hierarchy.
- **Sub-timeline with many events.** "Expands into" shows the sub-timeline name + event count ("6 events"); the count links into that [timeline detail](13-timeline-detail.md) rather than listing events inline.
- **Event with no home timeline.** "Contained in" shows "Not in any timeline" with a link to add; "Nearby in timeline" is omitted (no home to be nearby within).
- **Permissions: collaborator viewing a shared event** (per PRD §7.11.5; #127 reconciliation). Header status badge shows `⇄ Shared`. Edit appears only if the user is a collaborator-editor on the parent timeline (per system-design §9.2.1 RLS). Delete is hidden for collaborators (only owner + admin can delete).
- **Computed start/end date out of CE range.** The `computed_start_date` column is NULL for non-CE events. UI uses `temporal_data` directly for display in those cases.

## Open questions

> **Resolved (Batch 4):**
>
> - Nearby-event ordering (formerly "sibling events") — chronological proximity within the home timeline. See annotation #7. _(Reframed from parent_event_id siblings to timeline-membership neighbors under the forward fractal model, [#180](https://github.com/shaes-farm/time-traveler/issues/180).)_
> - Range-bar visualization — triggered rendering (uncertainty > 100 yr OR range > 1000 yr OR spans era boundary). See annotation #5.
> - Duration display — always shown with era-aware formatting. See annotation #5.
> - Media per-item affordances — overflow menu (`⋯`). See annotation #12.

_All initial open questions resolved. Future questions may be added as the wireframe is refined._

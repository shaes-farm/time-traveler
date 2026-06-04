# 13 — Timeline Detail

**Purpose.** Read + manage view of a single timeline. This is the author's primary workspace: it shows the timeline's metadata and publication state, lists and lets you arrange the events it contains, and hosts collaborator and media management. It is also the surface where the **fractal model** becomes visible — both "this timeline contains these events" and "this timeline details that event."

## Data shown

- Identity: title, slug, `timeline_type`, `scale`
- Narrative: summary, detail
- Temporal: declared span (`temporal_data` / `end_temporal_data`)
- `visibility` + published state (two independent axes — see [16-publish-workflow.md](16-publish-workflow.md))
- Subject character (biographical timelines)
- **Fractal context:** the event this timeline details, if any (inverse of `events.detail_timeline_id` — see [#177](https://github.com/shaes-farm/time-traveler/issues/177))
- Tabbed junction data: Events, Periods (read-only stub), Collaborators, Media

## Primary actions

- Edit timeline (→ [12-timeline-editor.md](12-timeline-editor.md))
- Publish / unpublish (header; see [16-publish-workflow.md](16-publish-workflow.md))
- Delete (danger zone)
- Link / unlink events (Events tab)
- Add / remove / re-role collaborators (Collaborators tab → [14-collaborators.md](14-collaborators.md))
- Attach / detach / reorder media (Media tab → [15-media-management.md](15-media-management.md))
- Navigate to a contained event, the subject character, or the detailed event

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Timelines ▸ Curie scientific biography              [Edit] [Publish ✓] [⋯]  │
│                                                                              │
│  Curie scientific biography                                                  │
│  Biographical · about Marie Curie · 🌐 Public · scale: a single lifetime     │
│  1867 CE — 1934 CE                                                           │
│                                                                              │
│  ⓘ Details the event:  ↗ "Marie Curie's life" (in Cosmic history)            │
│                                                                              │
│  Summary                                                                     │
│  ────────────────────────────────────────────────────────────────────────  │
│  The scientific life of Marie Curie, from her arrival in Paris through her   │
│  two Nobel Prizes to her death from aplastic anemia.                         │
│                                                                              │
│  ┌── Events (24) ──┬── Periods (0) ──┬── Collaborators (2) ──┬── Media (3) ─┐ │
│  ╞═════════════════╧═════════════════╧═══════════════════════╧═════════════╡ │
│  │                                       [ ⌕ filter ] [ + Link event ▾ ]   │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │  1891 CE  Sklodowska arrives in Paris      milestone   ★7   home    [×] │ │
│  │  1895 CE  Marriage to Pierre Curie         ceremony    ★6   home    [×] │ │
│  │  1898 CE  Discovery of polonium            discovery   ★8   home  ⤵ [×] │ │
│  │  1898 CE  Discovery of radium              discovery   ★8   home    [×] │ │
│  │  1903 CE  Curies share Nobel in Physics    ceremony    ★9   home    [×] │ │
│  │  1906 CE  Pierre Curie killed              incident    ★10  linked  [×] │ │
│  │  1911 CE  Solo Nobel in Chemistry          ceremony    ★9   home    [×] │ │
│  │  …                                                                      │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │  Showing 24 events · chronological order (no manual sort set) · ⠿ drag  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ▸ Danger zone                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Header mirrors the character/event detail headers** ([04](04-character-detail.md), [08](08-event-detail.md)): breadcrumb, title, a type/visibility/scale metadata line, and the action cluster `[Edit] [Publish] [⋯]`. The `[⋯]` overflow carries secondary actions (copy ID, view raw JSON, duplicate-deferred).

- **Publish precondition:** timeline publish is available only when at least one event is linked to the timeline (home or linked). Before then, the publish control is hidden/disabled with helper text and the service path rejects transition attempts.

2. **Two independent state badges in the header**, never merged: `visibility` (🔒/🌐/👥) and the publish badge. See [11-timeline-list.md](11-timeline-list.md) annotation #3 — the orthogonality of visibility and publication is a recurring source of confusion and the detail page is where authors act on both.
3. **Fractal context line (`ⓘ Details the event:`)** is the inverse lookup of `events.detail_timeline_id` ([#177](https://github.com/shaes-farm/time-traveler/issues/177)). When some event drills down _into_ this timeline, the header shows which event (and the timeline that event lives in), with a jump link. This is how an author navigates _up_ the fractal hierarchy — from a sub-timeline back to the event it expands. When no event details this timeline (it's a top-level timeline), the line is omitted. **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177)** — until the column lands, this line is hidden.
4. **Tabs:** Events | Periods | Collaborators | Media — the structure from issue #44. Counts in the labels (the established detail-tab convention). Tabs lazy-load on activation.
5. **Events tab is the heart of the page.** It lists every event contained by this timeline and lets the author link existing events in and unlink them.
   - **Containment is the union of two sources** (resolved fractal model, [#177](https://github.com/shaes-farm/time-traveler/issues/177)): events whose **primary** `timeline_id` is this timeline (badge: `home`) **plus** events linked via the `timeline_events` junction (badge: `linked`). The `home`/`linked` chip tells the author whether this is the event's primary home or a secondary appearance.
   - **Ordering is editorial `timeline_events.sort_order` ascending, with a chronological fallback.** The junction carries a `sort_order` column (migration `00012`, issue #122); the service layer's convention is: when every row shares the default `0`, fall back to the joined `events.sort_order_start` (chronological). So a timeline that hasn't been hand-arranged reads chronologically, and dragging a row to reorder writes a non-zero `sort_order` (e.g. for a comparative or thematic timeline where narrative beats matter more than dates). A short note under the list states the active ordering. Drag handle (`⠿`) per row enables manual arrangement.
6. **`[ + Link event ▾ ]`** opens a searchable combobox over the user's events (the same command-palette pattern as the event editor's timeline pickers, [09](09-event-editor.md) annotation #15). Selecting an event inserts a `timeline_events` junction row → it appears as `linked`. The split-button `▾` offers **Create new event in this timeline**, which deep-links to the [event editor](09-event-editor.md) with this timeline pre-filled as the primary `timeline_id` (so the new event lands as `home`).
7. **Unlink (`[×]`) semantics depend on home vs. linked:**
   - `linked` event → `[×]` deletes only the `timeline_events` junction row. The event is untouched and keeps its own home timeline.
   - `home` event → `[×]` is a heavier action: it would orphan the event's primary timeline. Confirm: "Remove this event's home timeline? It will have no primary timeline until you set a new one." (Sets `events.timeline_id = NULL`, per the FK's `ON DELETE SET NULL` spirit, done explicitly.) This guard prevents accidental orphaning.
8. **Per-row fractal drill-down marker (`⤵`)** appears on events that themselves have a `detail_timeline_id` — i.e. events you can zoom _into_ from here. Clicking `⤵` navigates to that sub-timeline's detail page. This is the "zoom in" direction; annotation #3's header line is the "zoom out" direction. **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177).**
9. **Periods tab is a read-only stub this pass** (resolved decision). Period CRUD arrives in Phase 6 (milestone 7). The tab renders linked periods (`period_timelines` junction) read-only if any exist, otherwise an empty state: "Period management arrives in a later release." Keeping the tab preserves issue #44's IA without designing period-linking prematurely.
10. **Collaborators tab** hosts the full collaborator panel — add by username, role select, remove, with owner safeguards. Fully specified in [14-collaborators.md](14-collaborators.md). The tab count excludes the owner (the owner is `timelines.user_id`, not a `timeline_collaborators` row).
11. **Media tab** uses the shared media management surface — attach (upload or external URL), reorder via `timeline_media.sort_order`, detach. Fully specified in [15-media-management.md](15-media-management.md).
12. **Edit/Delete are owner-gated; collaborator capability follows role.** Per system-design §9 RLS: the owner and admins see Edit/Delete; a collaborator-editor sees Edit (and event link/unlink) but not Delete; a collaborator-viewer gets a read-only page. The publish control is owner-only (see [16-publish-workflow.md](16-publish-workflow.md)). Action visibility is computed from the viewer's role, mirroring [08-event-detail.md](08-event-detail.md) Edge Cases.

## Tab variations

### Collaborators tab (summary — full spec in [14](14-collaborators.md))

```
  Collaborators (2)                                  [ + Add collaborator ]
  ───────────────────────────────────────────────────────────────────────
  @irenejc       Irène Joliot-Curie   editor ▾   [ remove ]
  @ebranly       Édouard Branly       viewer ▾   [ remove ]
  ─────────────────────────────────────────────────────────────
  Owner: you (Philipe Banglarian)  — owners can't be removed
```

### Media tab (summary — full spec in [15](15-media-management.md))

```
  Media (3)                            [ + Attach media ]
  ───────────────────────────────────────────────────────
  [cover] [thumb] [thumb]      drag ⠿ to reorder (timeline_media.sort_order)
```

### Periods tab (read-only stub)

```
  Periods (0)
  ───────────────────────────────────────────────────────
  — Period management arrives in a later release (Phase 6) —
```

## Edge cases

- **404 / not found.** Timeline lookup is by `(user_id, slug)` uniqueness; a slug that doesn't resolve for the current viewer (accounting for RLS) renders a 404 with a link back to the timelines list.
- **Empty Events tab.** "No events linked yet. Link existing events, or create one in this timeline." Two CTAs (Link / Create).
- **Span mismatch.** When contained events fall outside the timeline's declared span, surface a non-blocking advisory in the header span line: "3 events fall outside this timeline's span (1867–1934 CE)." Links to the offending rows. Never blocks — declared span is editorial, not a constraint.
- **Biographical timeline with a deleted subject.** `subject_character_id` is now NULL (FK `ON DELETE SET NULL`); the metadata line drops the "about X" chip rather than rendering a broken link.
- **Collaborator-viewer.** Whole page is read-only; tabs render but their add/remove affordances are hidden.
- **Loading.** Skeleton header; tabs lazy-load with per-tab skeletons (acceptance criterion: tab-level loading/error states).

## Open questions

- **Manual event ordering within a timeline.** Supported — `timeline_events.sort_order` exists (migration `00012`, issue #122). Default `0` everywhere reads as chronological; dragging assigns explicit ordering. Open sub-question: whether dragging rewrites a single row's `sort_order` or renumbers the whole set (sparse vs. dense ordering) — a fidelity-2 interaction detail, not a schema question.
- **"Fit span to events" convenience action.** A header action that sets `temporal_data`/`end_temporal_data` to the min/max `sort_order_years` of contained events. Useful, lives here (not the editor) because the events exist here. Deferred to a polish pass.
- **Bulk link.** Multi-select on the Link-event combobox (link several events at once). Deferred — single-link covers the common case; bulk operations are a cross-cutting later pass (see [01-user-flows.md](../01-user-flows.md) "What these flows do not cover").

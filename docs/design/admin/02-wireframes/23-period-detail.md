# 23 — Period Detail

**Purpose.** Read + manage a single period. This is where the **span-overlay model** is visible: a period is a labeled band with a place in the period hierarchy, overlaying one or more timelines, and the events that fall **within its temporal range** (by date — not by explicit linkage) are surfaced as computed context.

## Data shown

- Identity: title, slug, `significance`
- Narrative: summary, detail (rendered Markdown)
- Span: `temporal_data`–`end_temporal_data` (via `TemporalDisplay`)
- `characteristics` (tags), published state, timestamps
- **Hierarchy:** parent period (breadcrumb), child periods (`parent_period_id`)
- **Overlaid timelines:** `period_timelines` (add/remove)
- **Events in range:** events whose `sort_order_years` fall within `[sort_order_start, sort_order_end]` (computed, read-only)

## Primary actions

- Edit period (→ [22-period-editor.md](22-period-editor.md))
- Publish / unpublish (header; owner-only — [16-publish-workflow.md](16-publish-workflow.md))
- Delete (danger zone — cascades to child periods)
- Add / remove overlaid timelines; navigate to parent/child period, timeline, or an in-range event

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Periods ▸ Mesozoic Era ▸ Jurassic                   [Edit] [✓ Published ▾]   │
│                                                                              │
│  Jurassic                                                                    │
│  201–145 MYA · ██ High significance                                          │
│  reptiles · warm climate · shallow seas                                      │
│                                                                              │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Description                        │  Hierarchy                       │  │
│  │  ───────────────────────────────    │  ───────────────────────────     │  │
│  │  The middle period of the Mesozoic, │  Parent                          │  │
│  │  marked by the diversification of   │  ⌒ Mesozoic Era · 252–66 MYA     │  │
│  │  dinosaurs and the first birds.     │                                  │  │
│  │                                     │  Child periods                   │  │
│  │                                     │  — none —                        │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
│                                                                              │
│  ┌── Overlaid timelines (1) ──┬── Events in range (12) ──┐                   │
│  ╞════════════════════════════╧══════════════════════════╡                   │
│  │                                       [ + Overlay a timeline ]           │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │  ◷ Evolution of life on Earth     3.8 BYA – now           [ remove ]    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ▸ Danger zone                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Header mirrors the other detail headers.** Breadcrumb shows the **period hierarchy** (`Mesozoic Era ▸ Jurassic`) — periods _do_ nest (kept `parent_period_id`), so "up" is the parent period. Title, a `span · significance` metadata line (`TemporalDisplay` + the finalized significance ramp), characteristic tags, and `[Edit] [Publish ▾] [⋯]`.
2. **Two-column overview:** left = narrative (`summary`/`detail` Markdown); right = **Hierarchy** (parent + child periods, the navigation surface for the period tree). Child periods link down; parent links up. This is how authors traverse Mesozoic ⇄ Jurassic ⇄ ….
3. **Overlaid timelines tab** = the `period_timelines` junction. A period is a **span that overlays timelines** — it doesn't contain events, it _bands_ one or more timeline canvases. `[ + Overlay a timeline ]` opens a timeline picker; `[ remove ]` deletes the junction row. This is the period's only explicit association.
4. **Events in range tab is computed and read-only** — the heart of the **span-overlay decision**. It lists events whose `sort_order_years` fall within this period's `[sort_order_start, sort_order_end]`, **by date, not by any junction** (there is no `period_events` table). This answers "what happened during the Jurassic?" without anyone hand-linking events to the period.
   - **Scope toggle:** "all events in range" vs. "only events on the overlaid timelines." Default to the latter when overlays exist (the period is contextualizing _those_ canvases), else all-in-range.
   - It's read-only here: to put an event in a period you set the event's _date_, not a link. Each row links to the event; `TemporalDisplay` + importance ramp per the finalized language.
5. **No `period_events` linking, by design** (resolved M7 decision). A period that needed explicit, curated event membership would be a _timeline_, not a period. This is the IA line between the two: **timelines contain events (curated); periods overlay timelines and gather events by date (computed).** And an `event_type='period'` event is a third, distinct thing — a discrete event that happens to span time — not a row in this table.
6. **Significance + characteristics** are identity-level (header), not a tab — they describe the span itself.
7. **No media tab** — periods have no `period_media` junction.
8. **Danger zone — cascade warning.** `parent_period_id` is `ON DELETE CASCADE`, so deleting a period **deletes its child periods**. The confirm states the blast radius: "Delete Mesozoic Era? This also deletes 3 child periods (Triassic, Jurassic, Cretaceous). Events and timelines are unaffected." (Events/timelines are untouched — the period only overlaid them.) See [22-period-editor.md](22-period-editor.md) Open Questions on cascade-vs-reparent.
9. **Permissions.** Periods are owner-scoped (no collaborator path of their own; system-design §9.2.2 derives any collaborator visibility via the timelines they overlay). Owner-or-admin edit/delete; read-only for others on published periods.

## Tab variations

### Events in range (computed)

```
  Events in range (12)        Scope: ◉ On overlaid timelines  ◯ All in range
  ───────────────────────────────────────────────────────────────────────
  201 MYA   First true dinosaurs diversify     milestone   ★7   ↗
  155 MYA   Archaeopteryx                       discovery   ★8   ↗
  150 MYA   Morrison Formation deposits         period      ★5   ↗
  …
  computed by date — events are not linked to periods (span-overlay model)
```

## Edge cases

- **404 / not found.** Lookup by `(user_id, slug)` → 404 with link back to periods list.
- **Open-ended period** (`end_temporal_data` unset). "Events in range" uses `sort_order_years >= sort_order_start` (no upper bound). Header renders `201 MYA – …`.
- **No overlaid timelines.** Events-in-range defaults to "all in range" (no timelines to scope to); the Overlaid-timelines tab shows an empty state + CTA.
- **No events in range.** "No events fall within 201–145 MYA yet." (Not an error — the span may predate any authored events.)
- **Very large range** (e.g. a BYA-spanning period) returning thousands of in-range events. Paginate the computed list; it's read-only context, not a management surface.
- **Loading.** Skeleton header; tabs lazy-load (the in-range query is the expensive one — load it last).

## Open questions

- **Cascade vs. reparent on delete** — carried from [22-period-editor.md](22-period-editor.md). Schema cascades; a "reparent children to grandparent" option would be application-layer. Decision tracked with the period-service hardening (#60).
- **Events-in-range performance** — the computed query is `sort_order_years BETWEEN start AND end` (indexed via `idx_events_sort` / `idx_events_range`). For BYA spans this can be large; the scope-to-overlaid-timelines default mitigates. Cursor pagination (system-design §8.2) applies if it grows.
- **Period bands on the timeline visualization** (Phase 7) — periods are the natural source of "era bands" behind a timeline render. Out of scope here; flagged for the visualization phase.

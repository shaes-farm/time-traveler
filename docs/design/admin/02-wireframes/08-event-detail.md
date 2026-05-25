# 08 — Event Detail

**Purpose.** Read view of a single event. Surfaces temporal context, fractal lineage, participating characters, and attached media. Entry point for editing and for navigating to related entities.

## Data shown

- Identity: title, slug, event_type
- Narrative: summary, detail
- Temporal: temporal_data, end_temporal_data (range), computed durations
- Location: location string, spatial_data (lat/lng — defer visualization)
- Importance (1–10)
- Fractal: parent_event_id (breadcrumb), child events (count + list)
- Timeline membership (timeline_id + timeline title)
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
- Navigate to parent / child / timeline / participating character

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Events ▸ Curies' radium research ▸ Discovery of polonium                    │
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
│  │                                     │  Lineage                         │  │
│  │                                     │  ───────────────────────────     │  │
│  │                                     │  Parent                          │  │
│  │                                     │  ⌒ Curies' radium research       │  │
│  │                                     │     1895–1898 CE                 │  │
│  │                                     │                                  │  │
│  │                                     │  Sibling events (2)              │  │
│  │                                     │  ↳ Discovery of radium · 1898    │  │
│  │                                     │  ↳ Radium isolation · 1902       │  │
│  │                                     │                                  │  │
│  │                                     │  Child events                    │  │
│  │                                     │  — none —                        │  │
│  │                                     │                                  │  │
│  │                                     │  Timeline                        │  │
│  │                                     │  ───────────────────────────     │  │
│  │                                     │  Curie scientific biography      │  │
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

1. **Breadcrumb shows fractal lineage**, not just `Events ▸ This event`. The parent appears as a real segment so the user can navigate up.
2. **Two-column overview.** Left: narrative content (summary, detail). Right: structured metadata (temporal, location, lineage, timeline). Right column is fixed-width and doesn't scroll.
3. **Importance is in the header, near the type.** Both are categorical identifiers of the event.
4. **Temporal block shows the era explicitly.** "July 1898 CE (exact)" not "July 1898". For MYA/KYA events, era + precision dominate.
5. **Range vs. point.** If `end_temporal_data` is null, render "point event". If present, render "1895–1898 CE" with the inferred duration. **Duration is always shown** with era-aware formatting (Batch 4 decision Q3): CE/BCE renders "lived 66 years" or "spans 300 years"; KYA renders "spans 4,000 years"; MYA renders "spans 79 million years"; BYA rounds to significant digits. **A visual range bar renders only when** uncertainty > 100 years OR the range spans > 1000 years OR the range crosses an era boundary (Batch 4 decision Q2) — trivial CE ranges get no bar; "66 MYA ±1M" or "12 KYA – 8 KYA" get one. Exact thresholds and visual treatment refined at the next fidelity step.
6. **Lineage section** surfaces parent, siblings (other events with same parent), and children. This is the navigation surface for the fractal model — it's how authors traverse the tree.
7. **Sibling events** is a high-value affordance for fractal browsing — "what else happened in this research arc?" Cap at 5 visible; "see all" if more. **Ordered by chronological proximity** to the current event (Batch 4 decision Q1) — `ABS(this.sort_order_years - sibling.sort_order_years) ASC`. Importance is not used as secondary sort; the importance dimension is served on the events list, not here.
8. **Tabs below for the junction data.** Participants is the most active tab; Categories and Media are simpler.
9. **Participant rows show role + significance** as labels, not icons. The 11 roles are too many to encode with glyphs.
10. **Per-participant edit action** opens the inline participant editor (a sheet) — it edits only that one row.
11. **Spatial data** has a lat/lng pair shown as text. No map embed in this pass. Out of scope, but the data is there.
12. **Media per-item actions live in an overflow menu** (`⋯`) — Edit caption, Reorder, Detach (Batch 4 decision Q4). Always-visible inline buttons clutter at scale and none of these actions are frequent enough to claim per-row space. Standard admin-tool pattern.

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
- **Event at root of fractal tree (no parent).** Lineage section omits the Parent subsection; sibling list shows "other root events" or omits entirely depending on UX testing.
- **Event with many children.** Show first 5; "see all 23 child events" link opens the events list pre-filtered.
- **Event with no timeline.** Timeline section shows "Not in any timeline" with a link to add.
- **Permissions: collaborator viewing a shared event** (per PRD §7.11.5; #127 reconciliation). Header status badge shows `⇄ Shared`. Edit appears only if the user is a collaborator-editor on the parent timeline (per system-design §9.2.1 RLS). Delete is hidden for collaborators (only owner + admin can delete).
- **Computed start/end date out of CE range.** The `computed_start_date` column is NULL for non-CE events. UI uses `temporal_data` directly for display in those cases.

## Open questions

> **Resolved (Batch 4):**
>
> - Sibling-event ordering — chronological proximity. See annotation #7.
> - Range-bar visualization — triggered rendering (uncertainty > 100 yr OR range > 1000 yr OR spans era boundary). See annotation #5.
> - Duration display — always shown with era-aware formatting. See annotation #5.
> - Media per-item affordances — overflow menu (`⋯`). See annotation #12.

_All initial open questions resolved. Future questions may be added as the wireframe is refined._

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
5. **Range vs. point.** If `end_temporal_data` is null, render "point event". If present, render "1895–1898 CE" with the inferred duration.
6. **Lineage section** surfaces parent, siblings (other events with same parent), and children. This is the navigation surface for the fractal model — it's how authors traverse the tree.
7. **Sibling events** is a high-value affordance for fractal browsing — "what else happened in this research arc?" Cap at 5 visible; "see all" if more.
8. **Tabs below for the junction data.** Participants is the most active tab; Categories and Media are simpler.
9. **Participant rows show role + significance** as labels, not icons. The 11 roles are too many to encode with glyphs.
10. **Per-participant edit action** opens the inline participant editor (a sheet) — it edits only that one row.
11. **Spatial data** has a lat/lng pair shown as text. No map embed in this pass. Out of scope, but the data is there.

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
  ║   [thumbnail]  ║   sort_order: 0
  ║                ║   [ Edit caption ] [ Reorder ] [ Detach ]
  ╚════════════════╝
```

Media in `event_media` has `sort_order` for explicit ordering. Drag to reorder.

## Edge cases

- **No participants / no media / no categories.** Each tab shows an empty state with the add CTA.
- **Event at root of fractal tree (no parent).** Lineage section omits the Parent subsection; sibling list shows "other root events" or omits entirely depending on UX testing.
- **Event with many children.** Show first 5; "see all 23 child events" link opens the events list pre-filtered.
- **Event with no timeline.** Timeline section shows "Not in any timeline" with a link to add.
- **Permissions: collaborator viewing.** Edit appears only if the user is a collaborator-editor on the parent timeline (per system-design §9.2.1 RLS). Delete is hidden for collaborators (only owner + admin can delete).
- **Computed start/end date out of CE range.** The `computed_start_date` column is NULL for non-CE events. UI uses `temporal_data` directly for display in those cases.

## Open questions

- Should the temporal block render a small visual range bar when range is wide? For "1895–1898" probably not. For "68–66 MYA" with ±1M uncertainty, a range bar would clarify uncertainty visually. Defer.
- Sibling events: how do we pick which 5 to show? Closest in time? Most important? Currently arbitrary (creation order). Should be intentional.
- The "Edit caption" / "Reorder" / "Detach" affordances on media — overflow menu (⋯) or always-visible? Always-visible reads cluttered; overflow risks hiding key actions. Test with real data.
- For events with end_temporal_data, surface duration ("3 years 2 months")? Useful for human-scale events, meaningless for MYA. Show only when era is CE/BCE and range is < 200 years.

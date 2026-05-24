# 09 — Event Editor

**Purpose.** Create or edit an event. Includes the inline participant sub-editor — the second-hardest UX in the admin (after the relationships editor). Many concerns share one form: temporal range, fractal parent, participants, categories, media.

## Data captured

All event row columns except generated ones (`sort_order_years`, `computed_start_date`, `computed_end_date`, `sort_order_end`, `search_vector`) and timestamps:

- title (required)
- slug (auto-generated)
- summary
- detail
- event_type (10-enum)
- temporal_data (required — start)
- end_temporal_data (optional — end of range)
- location
- spatial_data (JSONB — lat/lng)
- importance (1–10)
- parent_event_id (optional)
- timeline_id (optional)
- metadata
- published

Plus junction data managed inline:

- `event_characters` (per-row: character_id, role, significance, description)
- `event_categories` (per-row: category_id)
- `event_media` (per-row: media_id, sort_order)

## Primary actions

- Save (creates event + junction rows via `createEventWithRelations`)
- Save and add another
- Cancel / discard

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Events ▸ New event                                  [ Cancel ] [ Save ▾ ]   │
│                                                                              │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Identity                           │  Slug                            │  │
│  │  ───────────────────────────────    │  ───────────────────────────     │  │
│  │  Title *                            │  discovery-of-polonium  [ regen ]│  │
│  │  [ Discovery of polonium       ]    │                                  │  │
│  │                                     │  Importance (1–10)               │  │
│  │  Type *                             │  [────●──────] 8                 │  │
│  │  [ Discovery                  ▾]    │                                  │  │
│  │                                     │  Published                       │  │
│  │  Summary                            │  ◯ Draft / publish on save       │  │
│  │  ┌─────────────────────────────┐    │                                  │  │
│  │  │ One-paragraph summary…      │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  Detail                             │                                  │  │
│  │  ┌─────────────────────────────┐    │                                  │  │
│  │  │ Long-form narrative…        │    │                                  │  │
│  │  │                             │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  When                               │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Start date *  [ 1898 CE (exact) ▾] │                                  │  │
│  │  End date      [ + Add (point evt) ]│                                  │  │
│  │                                     │                                  │  │
│  │  Where                              │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Location      [ Paris, France   ]  │                                  │  │
│  │  Coordinates   [ 48.8566 ] [ 2.3522]│                                  │  │
│  │                                     │                                  │  │
│  │  Lineage                            │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Parent event  [ Curies' radium … ▾]│                                  │  │
│  │                Range: 1895–1898 CE  │                                  │  │
│  │                                     │                                  │  │
│  │  Timeline      [ Curie biography ▾] │                                  │  │
│  │                                     │                                  │  │
│  │  Participants (2)                   │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  ┌────────────────────────────────┐ │                                  │  │
│  │  │ [photo] Marie Curie            │ │                                  │  │
│  │  │   role: protagonist ▾          │ │                                  │  │
│  │  │   significance: primary ▾      │ │                                  │  │
│  │  │   note: "led the isolation"  ×│ │                                  │  │
│  │  ├────────────────────────────────┤ │                                  │  │
│  │  │ [photo] Pierre Curie           │ │                                  │  │
│  │  │   role: protagonist ▾          │ │                                  │  │
│  │  │   significance: primary ▾    × │ │                                  │  │
│  │  └────────────────────────────────┘ │                                  │  │
│  │  [ + Add participant            ]   │                                  │  │
│  │                                     │                                  │  │
│  │  Categories                         │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  [ Physics ×] [ Discovery ×]        │                                  │  │
│  │  [ + Add category               ]   │                                  │  │
│  │                                     │                                  │  │
│  │  Media                              │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  [thumb] [thumb] [ + Attach ]       │                                  │  │
│  │                                     │                                  │  │
│  │  ▸ Advanced (metadata, spatial JSON)│                                  │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same two-column shell** as the character editor. Left: narrative + relationships. Right: identity-adjacent metadata. Slug behavior matches the character editor (live 300ms debounced regeneration on create; locked-by-default with `[edit slug]` unlock affordance on update) — see [05-character-editor.md](05-character-editor.md) annotation #3.
2. **Importance is a slider** on the right rail. 1–10 with integer steps. Live numeric label.
3. **When/Where/Lineage sectioning.** Three named sections in the left column structure the form so it doesn't feel like an unbroken wall of inputs.
4. **End date defaults to "point event"** — the schema makes end_temporal optional. Most events are point events; range events are the exception. Affordance shows the current state as an empty button so the user knows it's settable.
5. **Parent event picker** is a combobox / command-palette pattern. Search by title; result rows show the parent's temporal range so the user can sanity-check. After selection, the parent's range renders below the field — context for child placement. A `[ browse hierarchy ]` link on the right of the picker is documented as a future affordance that would open a side-sheet tree view; not built in this pass (Batch 2 decision Q4 — most authors know parent titles, so the combobox is sufficient).
6. **Cycle prevention** (per system-design §3.4 note on self-referential FK cycles): the picker excludes this event itself and any descendants. If editing an existing event with descendants, the picker pre-filters them out.
7. **Participants sub-editor is inline**, not a modal — always inline regardless of count (Batch 2 decision Q6). The section header shows the count ("Participants (47)") and is collapsible; the section scrolls internally when it grows long. For events with 20+ participants, a future "manage participants in side sheet" affordance is documented but deferred — the inline editor stays the default, with a `[ open in side sheet ]` link when the count crosses a future threshold. Each participant is a card with editable role + significance + description. The "add" CTA opens a character picker (searchable combobox).
8. **Per-participant role + significance** are inline selects, not labels. Editing a role doesn't require a sub-modal. The `×` removes the participant from the event.
9. **Per-participant `description`** is the column on `event_characters` that lets the author note context for _this character's role in this event_ ("led the isolation"). It's optional and shown inline.
10. **Categories use multi-select chip input.** Selecting opens a combobox over the user's categories. Adding a new category from here is allowed but quick-create only (full category editor is a separate flow).
11. **Media is a thumbnail grid + add affordance.** Reordering and detaching happen in the event detail view, not in the editor (avoids a second drag-reorder surface).
12. **Coordinates** are split into two number inputs. No map widget in this pass.

## Save flow

Per system-design §5.3, `createEventWithRelations` issues the event insert and parallel junction inserts. The editor:

1. Validates client-side (Zod, including `temporalDataSchema`).
2. Optimistically inserts via TanStack Query.
3. On event insert success, fires three parallel junction inserts.
4. On any junction failure, shows a toast with "event saved, but participants/categories/media failed to attach — retry from event detail."
5. On all success, redirects to event detail.

## Edge cases

- **Parent event date mismatch.** If `start_temporal` falls outside the parent's `[temporal_data, end_temporal_data]` range, show a soft warning beneath the parent field: "Parent event's range is 1895–1898 CE; this event's date is 1899 CE." Save not blocked.
- **End date before start date.** Hard validation error; save blocked.
- **Removing a participant who has an inline description.** Confirm dialog: "Remove Marie Curie? The note 'led the isolation' will be deleted."
- **Switching event_type mid-edit.** No fields change; type is purely categorical. No warning needed.
- **Timeline picker scope.** The picker shows only timelines the current user can write to (owner OR collaborator-editor).
- **Coordinates valid range.** Latitude −90 to 90; longitude −180 to 180. Inline validation.
- **Image upload mid-save.** Same pattern as character editor — uploads complete in background, partial failure is surfaced in a toast.

## Open questions

- Could a "duplicate event" affordance live in the save dropdown? Useful for repeated events with small variations (e.g., a series of conflicts). Defer until users ask.
- Coordinates as a map picker — when does this become required? Probably when the project commits to a spatial visualization view. Until then, text inputs are fine.
- Participant inline editing vs. modal. Inline is faster for power users but the row gets visually busy with role/significance/description all visible. Test with 5+ participants on one event before committing.
- For range events spanning multiple eras (rare but possible, e.g., "the cooling of the Earth"), the temporal control needs to be aware. Out of scope but flagged.
- Should the "Save" dropdown include "Save and publish"? Or is "Publish" only a toggle on the right rail? Currently the right-rail toggle is canonical; the dropdown is a shortcut.

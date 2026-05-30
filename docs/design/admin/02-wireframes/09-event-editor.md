# 09 — Event Editor

**Purpose.** Create or edit an event. Includes the inline participant sub-editor — the second-hardest UX in the admin (after the relationships editor). Many concerns share one form: temporal range, fractal decomposition (the sub-timeline an event expands into), timeline membership, participants, categories, media.

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
- ~~parent_event_id~~ — **removed from the form.** Event-to-event nesting is retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)); decomposition is expressed forward via `detail_timeline_id`.
- timeline_id (optional — the event's **primary containing timeline**; RLS source)
- detail_timeline_id (optional — the fractal **drill-down sub-timeline** this event expands into; **blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177)** until the column lands)
- metadata
- published

Plus secondary timeline membership managed inline:

- `timeline_events` (per-row: timeline_id) — **additional** "also appears in" timelines beyond the primary one

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
│  │  Timelines                          │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Primary timeline                   │                                  │  │
│  │     [ Curie biography           ▾]  │                                  │  │
│  │  Also appears in                    │                                  │  │
│  │     [ Women in science ×] [ + Add ] │                                  │  │
│  │  Expands into (sub-timeline)        │                                  │  │
│  │     [ — none —             ▾] [ ↗ ] │                                  │  │
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
3. **When/Where/Timelines sectioning.** Three named sections in the left column structure the form so it doesn't feel like an unbroken wall of inputs. The Timelines section holds the timeline-relationship fields (annotation #15). _(Formerly "Lineage & timelines" — the parent-event field was removed; see annotation #5.)_
4. **End date defaults to "point event"** — the schema makes end_temporal optional. Most events are point events; range events are the exception. Affordance shows the current state as an empty button so the user knows it's settable.
5. **No parent-event picker** ([#180](https://github.com/shaes-farm/time-traveler/issues/180)). Event-to-event nesting is retired in favor of the forward fractal model: to make an event part of a larger structure you either put it in the same timeline (it becomes a chronological neighbor) or you make the larger event **expand into** a sub-timeline (annotation #15) and add this event to that sub-timeline. There is no `parent_event_id` field on this form anymore. The cycle-prevention concern that the old parent picker carried now applies to the **Expands into** field instead (annotation #15).
6. **Cycle prevention applies to "Expands into"** (annotation #15), not to a parent field. The sub-timeline picker excludes any timeline that (transitively) contains this event, so an event can't expand into a timeline it already lives in. Service-layer, consistent with the descendant-exclusion logic that previously guarded the parent picker.
7. **Participants sub-editor is inline**, not a modal — always inline regardless of count (Batch 2 decision Q6). The section header shows the count ("Participants (47)") and is collapsible; the section scrolls internally when it grows long. For events with 20+ participants, a future "manage participants in side sheet" affordance is documented but deferred — the inline editor stays the default, with a `[ open in side sheet ]` link when the count crosses a future threshold. Each participant is a card with editable role + significance + description. The "add" CTA opens a character picker (searchable combobox).
8. **Per-participant role + significance** are inline selects, not labels. Editing a role doesn't require a sub-modal. The `×` removes the participant from the event.
9. **Per-participant `description`** is the column on `event_characters` that lets the author note context for _this character's role in this event_ ("led the isolation"). It's optional and shown inline.
10. **Categories use multi-select chip input.** Selecting opens a combobox over the user's categories. Adding a new category from here is allowed but quick-create only (full category editor is a separate flow).
11. **Media is a thumbnail grid + add affordance.** Reordering and detaching happen in the event detail view, not in the editor (avoids a second drag-reorder surface). `[ + Attach ]` opens the shared Attach dialog ([15-media-management.md](15-media-management.md)); its **Existing** tab reuses media already in the library via the [17-media-library.md](17-media-library.md) picker instead of forcing a re-upload.
12. **Coordinates** are split into two number inputs. No map widget in this pass.

13. **Save dropdown for events** (Batch 5 decisions Q3, Q4). Primary action: "Save". Dropdown: "Save and add another" (create flow only). **"Save and add another" persists a curated set**: `event_type`, `timeline_id` (primary timeline), `categories` carry forward to the next blank form. Cleared: title, slug, summary, detail, temporal data, location, coordinates, participants, media, "also appears in", "expands into". _(`parent_event_id` is no longer in the set — the field is removed, [#180](https://github.com/shaes-farm/time-traveler/issues/180).)_ An inline note after save reports what was cleared vs. persisted. **No "Duplicate" option** in the dropdown — deferred until real user demand surfaces (Q4); the persistence-based pattern handles the bulk-create case without an explicit duplicate.
14. **Auto-save to draft state every 30 seconds** (per PRD §7.11.3; #127 reconciliation). Same pattern as the character editor — see [05-character-editor.md](05-character-editor.md) annotation #11. The top-right of the editor toolbar shows `Draft saved at H:MM PM` after each successful auto-save. Auto-save never publishes; the explicit Save button is still required for Draft → Published.

15. **Three distinct timeline relationships — do not conflate them** (fractal model; resolved during M5 design, see [#177](https://github.com/shaes-farm/time-traveler/issues/177) and [13-timeline-detail.md](13-timeline-detail.md)):
    - **Primary timeline** (`timeline_id`, single combobox) — the timeline this event _belongs to_. This is the RLS source: collaborator read/edit access derives from it (system-design §9). Optional, but an event with no primary timeline is owner-only.
    - **Also appears in** (`timeline_events` junction, multi chip-add) — _additional_ timelines the event surfaces in (e.g. a comparative timeline), without changing its home. This is the same containment the [timeline detail Events tab](13-timeline-detail.md) edits from the other side; managing it here is a convenience. Optional.
    - **Expands into** (`detail_timeline_id`, single combobox + `[ ↗ ]` create-new) — the fractal **drill-down**: the sub-timeline this event decomposes into (the "Earth forms" event opening into an "evolution of life" timeline). The `[ ↗ ]` shortcut mints a new timeline with inherited defaults (title seeded from the event, span clamped to the event's range) and links it as this event's drill-down in one step — this is what keeps forward-only nesting low-ceremony. **This is the sole decomposition mechanism** now that `parent_event_id` is retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)). **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177)** — hidden until the column lands; cycle prevention (an event can't expand into a timeline that contains it) is service-layer (annotation #6).

## Save flow

Per system-design §5.3, `createEventWithRelations` issues the event insert and parallel junction inserts. The editor:

1. Validates client-side (Zod, including `temporalDataSchema`).
2. Optimistically inserts via TanStack Query.
3. On event insert success, fires three parallel junction inserts.
4. On any junction failure, shows a toast with "event saved, but participants/categories/media failed to attach — retry from event detail."
5. On all success, redirects to event detail.

## Edge cases

- **Sub-timeline span mismatch ("Expands into").** If this event's date falls outside the chosen sub-timeline's declared span, show a soft warning beneath the field: "The sub-timeline spans 1895–1898 CE; this event's date is 1899 CE." Save not blocked (declared span is editorial). _(Replaces the former parent-event date-mismatch warning.)_
- **End date before start date.** Hard validation error; save blocked.
- **Removing a participant who has an inline description.** Confirm dialog: "Remove Marie Curie? The note 'led the isolation' will be deleted."
- **Switching event_type mid-edit.** No fields change; type is purely categorical. No warning needed.
- **Timeline picker scope.** The picker shows only timelines the current user can write to (owner OR collaborator-editor).
- **Coordinates valid range.** Latitude −90 to 90; longitude −180 to 180. Inline validation.
- **Image upload mid-save.** Same pattern as character editor — uploads complete in background, partial failure is surfaced in a toast.

## Open questions

- Coordinates as a map picker — when does this become required? Probably when the project commits to a spatial visualization view. Until then, text inputs are fine. (Tier 4 — defer until implementation surfaces real demand.)
- For range events spanning multiple eras (rare but possible, e.g., "the cooling of the Earth"), the temporal control needs to be aware. Out of scope but flagged. (Tier 4.)
- Should the "Save" dropdown include "Save and publish"? Or is "Publish" only a toggle on the right rail? Currently the right-rail toggle is canonical; the dropdown is a shortcut. _(Minor cleanup item; not in the in-scope review.)_

> **Resolved (Batch 2):**
>
> - ~~Parent event picker UX~~ — **superseded.** The parent-event field was removed entirely under the forward fractal model ([#180](https://github.com/shaes-farm/time-traveler/issues/180)); decomposition is the "Expands into" sub-timeline field (annotation #15). See annotation #5.
> - Inline-participant editing scalability — always inline with internal scroll; no threshold-switch. See annotation #7.
>
> **Resolved (Batch 5):**
>
> - Duplicate event affordance — deferred until users request it. The persistence-based "Save and add another" handles the bulk-create case. See annotation #13.
> - "Save and add another" field persistence — curated set: `event_type`, `timeline_id`, `categories`. (`parent_event_id` dropped from the set with the field's removal, [#180](https://github.com/shaes-farm/time-traveler/issues/180).) See annotation #13.

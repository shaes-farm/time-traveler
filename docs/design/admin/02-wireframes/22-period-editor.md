# 22 — Period Editor

**Purpose.** Create or edit a period's row fields — span, significance, characteristics, and its place in the period hierarchy. Timeline overlays (`period_timelines`) are managed on [period detail](23-period-detail.md), matching the editor/detail split used for timelines and stories.

## Data captured

All `periods` row columns except generated (`sort_order_start`, `sort_order_end`) and timestamps:

- `title` (required)
- `slug` (auto-generated)
- `summary`
- `detail` (Markdown)
- `temporal_data` (start of span)
- `end_temporal_data` (end of span — expected for closed periods)
- `parent_period_id` (hierarchical; cycle-prevented)
- `significance` (`low|medium|high|critical`)
- `characteristics` (`TEXT[]`, chip input)
- `published` (toggle; canonical action on detail — [16-publish-workflow.md](16-publish-workflow.md))

## Primary actions

- Save (create → `useCreatePeriod`; edit → `useUpdatePeriod`)
- Cancel / discard (unsaved-changes guard)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Periods ▸ New period                                [ Cancel ] [ Save ]     │
│                                                          Draft saved 4:31 PM │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Identity                           │  Slug                            │  │
│  │  ───────────────────────────────    │  jurassic        [ edit slug ]   │  │
│  │  Title *                            │                                  │  │
│  │  [ Jurassic                  ]      │  Significance                    │  │
│  │                                     │  ───────────────────────────     │  │
│  │  Summary                            │  ◯ Low  ◯ Medium  ◉ High  ◯ Crit │  │
│  │  ┌─────────────────────────────┐    │   ███  (sequential ramp)         │  │
│  │  │ Brief description…          │    │                                  │  │
│  │  └─────────────────────────────┘    │  Published                       │  │
│  │                                     │  ◯ Draft (publish from detail)   │  │
│  │  Detail                             │                                  │  │
│  │  ┌─────────────────────────────┐    │                                  │  │
│  │  │ Full description, Markdown… │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  Span                               │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Start *  [ 201 MYA            ▾]    │                                  │  │
│  │  End      [ 145 MYA            ▾]    │                                  │  │
│  │                                     │                                  │  │
│  │  Hierarchy                          │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Parent period  [ Mesozoic Era  ▾]  │                                  │  │
│  │                 Range: 252–66 MYA   │                                  │  │
│  │                                     │                                  │  │
│  │  Characteristics                    │                                  │  │
│  │  [ reptiles ×] [ warm ×] [ + add ]  │                                  │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same two-column editor shell** as the timeline/story editors. Slug behavior matches the others ([05](05-character-editor.md) annotation #3); uniqueness `(user_id, slug)` via `periods_slug_idx`.
2. **Span uses the shared [TemporalInput control](10-temporal-input.md)** for start (`temporal_data`, required) and end (`end_temporal_data`). Periods are closed spans by intent, so the form nudges toward setting an end (a single-point period is unusual), but the schema allows open. **End-before-start is a hard validation error.**
3. **`significance` is a four-way control on the right rail**, rendered with the finalized sequential ramp ([03-aesthetic-notes.md](../03-aesthetic-notes.md) § _Significance scale_) — the same amber ramp as event importance. Defaults to `medium` (schema default).
4. **Parent period picker = hierarchy.** A searchable combobox over the user's periods; on selection it shows the parent's range so the author can sanity-check that the child span sits inside it. **Cycle prevention** (service-layer, per system-design §3.4): the picker excludes this period and its descendants — `parent_period_id` cycles are not DB-constrained. This is the **kept** self-nesting axis (periods are genuinely hierarchical spans; contrast the retired event `parent_event_id`, [#180](https://github.com/shaes-farm/time-traveler/issues/180)).
5. **Characteristics are a chip input** over `characteristics TEXT[]` — defining attributes of the span ("reptiles", "warm climate"). Same chip pattern as character aliases / story tags ([05](05-character-editor.md) annotation #5). These are descriptive, not a filterable taxonomy (that's Categories, which don't attach to periods).
6. **Publish is a Draft toggle here; canonical publish on detail** — same rationale as timelines/stories ([12](12-timeline-editor.md) annotation #5).
7. **No timeline-overlay management in this editor.** `period_timelines` (which timelines this period overlays) is managed on [period detail](23-period-detail.md), because the overlay is about placing an existing period onto canvases — a post-creation act. On successful create, redirect to detail.
8. **Auto-save to draft every 30s** + **unsaved-changes guard**, identical to the other editors.

## Save flow

1. Validate client-side (Zod): `title` required; `temporal_data` valid + required; end-after-start; `significance` in enum; parent picker excludes self/descendants.
2. `useCreatePeriod` / `useUpdatePeriod` (optimistic).
3. On success, redirect to **period detail** (`/periods/[slug]`).

## Edge cases

- **Child span outside parent range.** Soft, non-blocking warning beneath the parent field: "Mesozoic Era spans 252–66 MYA; this period's span is 300–280 MYA (outside)." Allowed — period boundaries are sometimes fuzzy/overlapping, same posture as the event/sub-timeline span-mismatch warnings.
- **End before start.** Hard error; save blocked.
- **Cycle attempt.** Picker pre-excludes descendants; if a race slips through, the service rejects and the form surfaces "That would create a circular period hierarchy."
- **Deleting a parent period later.** FK `parent_period_id ... ON DELETE CASCADE` — deleting a parent **deletes its descendants**. This is surfaced as a blast-radius warning on [period detail](23-period-detail.md) Danger zone, not here.
- **Slug collision.** `resolveCollision` appends a suffix, surfaced inline.

## Open questions

- **Cascade vs. reparent on parent delete.** The schema is `ON DELETE CASCADE` (deleting Mesozoic deletes Triassic/Jurassic/…). Is cascade the right policy, or should children reparent to the grandparent? Flagged for the period-detail Danger zone design ([23](23-period-detail.md)) and for the service hardening issue (#60). Schema currently dictates cascade; a reparent policy would be application-layer.
- **Geological/cosmological metadata** (PRD §2.1.3 "geological and cosmological period metadata") — beyond `characteristics`, is there structured geological metadata (eon/era/period/epoch rank)? Not in the current schema (`metadata` JSONB is not on `periods`). Deferred; `characteristics` carries it as free text for now.

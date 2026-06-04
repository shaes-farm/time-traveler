# 12 — Timeline Editor

**Purpose.** Create or edit a timeline. Simpler than the event editor — no inline junction sub-editors — but it owns two model subtleties: the **visibility vs. publication** split, and the **biographical-subject** conditional field. Event linking, collaborators, and publication all happen on the [timeline detail](13-timeline-detail.md) page after the timeline exists, not here.

## Data captured

All `timelines` row columns except generated ones (`sort_order_start`, `sort_order_end`, `search_vector`) and timestamps:

- `title` (required)
- `slug` (auto-generated)
- `summary`
- `detail`
- `scale` (free-form label for the timeline's intended zoom granularity, e.g. "geological", "decades", "days")
- `timeline_type` (`general|biographical|comparative`)
- `subject_character_id` (conditional — biographical only)
- `temporal_data` (start of span)
- `end_temporal_data` (end of span)
- `visibility` (`private|public|shared`)
- `fractal_depth` (integer, default 5 — advanced)
- `metadata` (advanced)

Publication note:

- Timeline editor has no publish control. New timelines are created/edited as draft content, and publish/unpublish is detail-page-only (see [16-publish-workflow.md](16-publish-workflow.md)).

## Primary actions

- Save (create → `useCreateTimeline`; edit → `useUpdateTimeline`)
- Cancel / discard (with unsaved-changes guard)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Timelines ▸ New timeline                            [ Cancel ] [ Save ]     │
│                                                          Draft saved 4:12 PM │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Identity                           │  Slug                            │  │
│  │  ───────────────────────────────    │  ───────────────────────────     │  │
│  │  Title *                            │  curie-scientific-biography      │  │
│  │  [ Curie scientific biography  ]    │  [ edit slug ]                   │  │
│  │                                     │                                  │  │
│  │  Type *                             │  Visibility                      │  │
│  │  [ Biographical              ▾]     │  ───────────────────────────     │  │
│  │                                     │  ◯ 🔒 Private  (only you)         │  │
│  │  Subject character *                │  ◉ 🌐 Public   (anyone, once     │  │
│  │  [ Marie Curie              ▾]      │       published)                 │  │
│  │   ⓘ shown for biographical type     │  ◯ 👥 Shared   (collaborators)   │  │
│  │                                     │                                  │  │
│  │  Summary                            │  ⓘ Visibility ≠ publication.     │  │
│  │  ┌─────────────────────────────┐    │     Publish from the detail page │  │
│  │  │ One-paragraph summary…      │    │     to make a public/shared      │  │
│  │  └─────────────────────────────┘    │     timeline actually live.      │  │
│  │                                     │                                  │  │
│  │  Detail                             │  Publication                     │  │
│  │  ┌─────────────────────────────┐    │  ◯ Draft (publish from detail)   │  │
│  │  │ Long-form description…      │    │                                  │  │
│  │  │                             │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  Span                               │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Start  [ 1867 CE (exact)      ▾]   │                                  │  │
│  │  End    [ 1934 CE (exact)      ▾]   │                                  │  │
│  │  Scale  [ a single lifetime    ]    │                                  │  │
│  │                                     │                                  │  │
│  │  ▸ Advanced (fractal depth, metadata)│                                 │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same two-column editor shell** as the character ([05](05-character-editor.md)) and event ([09](09-event-editor.md)) editors. Left: narrative + structured input. Right: identity-adjacent metadata (slug, visibility, publication guidance). Reuse, don't reinvent.
2. **Slug behavior matches the other editors** ([05](05-character-editor.md) annotation #3): live 300ms-debounced regeneration from the title on the create form; locked-by-default with an `[ edit slug ]` unlock (and a "this breaks existing links" warning) on the edit form. Uniqueness is `(user_id, slug)` per `timelines_slug_idx` — collision resolution reuses the shared `resolveCollision` utility.
3. **Type drives one conditional field.** Selecting `timeline_type = biographical` reveals a required **Subject character** picker (`subject_character_id`, a searchable combobox over the user's characters). Switching away from biographical hides it and clears the value (with a confirm if one was set). `general` and `comparative` show no extra fields this pass.
4. **Visibility is a three-way radio with plain-language helper text**, not a bare dropdown. The model subtlety that trips authors is that **visibility and publication are orthogonal** (see [11-timeline-list.md](11-timeline-list.md) annotation #3 and [16-publish-workflow.md](16-publish-workflow.md)). The inline ⓘ note states it explicitly and points publication to the detail page. `shared` visibility is what makes the timeline reachable by the people added in [14-collaborators.md](14-collaborators.md).
5. **Timeline editor is draft-only; publishing is owned by the detail page.** The editor has no publish toggle. New timelines are always created as draft content and editing never changes an existing row's live state. The canonical publish/unpublish action — with confirmation and the linked-events precondition — lives in the [timeline detail header](13-timeline-detail.md) and [16-publish-workflow.md](16-publish-workflow.md). Rationale: timelines become publishable only after event linking, which is managed on detail.
6. **Span uses the shared [TemporalInput control](10-temporal-input.md)** for both start (`temporal_data`) and end (`end_temporal_data`), era-aware (CE/BCE/KYA/MYA/BYA). Both are optional at the schema level (`temporal_data` defaults to `'{}'`), but a timeline with no span shows `—` everywhere downstream, so the form nudges (not blocks) the author to set at least a start. **End-before-start is a hard validation error**, consistent with the event editor.
7. **`scale` is a free-form text label**, not an enum — the schema is `VARCHAR(2000)`. It's a human note about intended granularity ("geological", "a single lifetime", "decades"), surfaced on the detail header. No controlled vocabulary in this pass; flagged as a future enum candidate.
8. **`fractal_depth` and `metadata` live behind the Advanced disclosure.** `fractal_depth` (default 5) is a rendering hint for the eventual visualization (Phase 7) — most authors never touch it, so it does not deserve top-level real estate. Same escape-hatch pattern as the character editor's JSON fields ([05](05-character-editor.md) annotation, Batch 4).
9. **Auto-save to draft every 30 seconds** (per PRD §7.11.3; #127 reconciliation), identical to the character/event editors. The toolbar shows `Draft saved at H:MM PM`. Auto-save never publishes.
10. **Unsaved-changes guard** (issue #43): navigating away with a dirty form prompts to discard. Standard pattern; reuse the editor-shell guard already specified for [05](05-character-editor.md)/[09](09-event-editor.md).
11. **No event/collaborator/media management in this editor.** Those are post-creation, detail-page concerns (issue #43 explicitly scopes this form to timeline row fields). On a successful create the user is redirected to the timeline detail, where linking events is the natural next step.

## Save flow

1. Validate client-side (Zod, including `temporalDataSchema` for both span endpoints, and `subject_character_id` required-when-biographical).
2. `useCreateTimeline` / `useUpdateTimeline` (optimistic via TanStack Query).
3. On success, redirect to **timeline detail** (`/timelines/[slug]`).

## Edge cases

- **Biographical type with no subject chosen.** Hard validation error: "Biographical timelines need a subject character." Save blocked until set or type changed.
- **Subject character deleted later.** FK is `ON DELETE SET NULL` (schema). The detail page handles the now-null subject gracefully; the editor just shows an empty picker on next edit.
- **Switching type from biographical to general with a subject set.** Confirm: "Remove Marie Curie as the subject of this timeline?" Clearing is non-destructive to the character.
- **End span before start span.** Hard error on the End field; save blocked.
- **Visibility = shared but no collaborators yet.** Allowed — `shared` just opens the door; collaborators are added on the detail page. No warning needed.
- **Slug collision on save.** Caught via `timelines_slug_idx`; `resolveCollision` appends a suffix and the form surfaces the resolved slug inline.

## Open questions

- **`scale` as an enum vs. free text** — kept free text this pass (matches schema). If a visualization in Phase 7 needs to key zoom behavior off scale, an enum migration becomes worthwhile. Tier 4 — defer until the visualization surfaces real demand.
- **Should the timeline span auto-suggest from member events?** A "set span to fit contained events" convenience action is appealing but belongs on the detail page (where the events are), not the create form (where there are none yet). Documented as a future detail-page affordance — see [13-timeline-detail.md](13-timeline-detail.md) Open Questions.

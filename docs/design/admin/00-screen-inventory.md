# Admin Screen Inventory — Core CRUD + Relationships

Status: draft 1 — markdown wireframes phase
Scope: characters + events CRUD, character relationships, the junctions that touch those entities

> **Milestone 5 extension (Phase 4 — Timeline & Event management).** A second wireframe batch (screens 11–16) was added to cover the timeline, media, collaborator, and publish surfaces that were deliberately deferred in the original pass. See [Milestone 5 additions](#milestone-5-additions) below for the screen table, the resolved **fractal containment-vs-decomposition model**, and the upstream issues filed during the design.

## What's in scope

| #   | Screen                         | Purpose                                                                                                                                                                       | Wireframe                                                                            |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0   | App shell                      | Persistent chrome: sidebar nav, topbar (user menu, global search stub), content area, breadcrumb                                                                              | [02-wireframes/00-app-shell.md](02-wireframes/00-app-shell.md)                       |
| 1   | Sign in                        | Email + magic-link entry. Out-of-band concern but listed for completeness — minimal annotation only                                                                           | [02-wireframes/01-sign-in.md](02-wireframes/01-sign-in.md)                           |
| 2   | Dashboard                      | Entity counts (powered by `get_user_metrics` RPC) + recent activity + quick-create buttons                                                                                    | [02-wireframes/02-dashboard.md](02-wireframes/02-dashboard.md)                       |
| 3   | Characters list                | Paginated table of the user's characters, filterable by `character_type` and significance, searchable by name/alias                                                           | [02-wireframes/03-characters-list.md](02-wireframes/03-characters-list.md)           |
| 4   | Character detail               | Read view: identity, biography, temporal scope (birth/death), aliases, profile media, event participation summary, relationship summary                                       | [02-wireframes/04-character-detail.md](02-wireframes/04-character-detail.md)         |
| 5   | Character editor               | Create/edit form. Adapts visible fields by `character_type` (species/breed for animal, domain for divine, etc.)                                                               | [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md)         |
| 6   | Character relationships editor | The hardest screen. Manages temporally-scoped many-to-many edges with 11 type values and directionality semantics. Three alternatives sketched                                | [02-wireframes/06-relationships-editor.md](02-wireframes/06-relationships-editor.md) |
| 7   | Events list                    | Paginated table sorted by `sort_order_years`, filterable by `event_type`, importance, timeline, era, character participant                                                    | [02-wireframes/07-events-list.md](02-wireframes/07-events-list.md)                   |
| 8   | Event detail                   | Read view: title, temporal range, location, type, importance, containing/sub-timelines (forward fractal), nearby events, participating characters, attached media, categories | [02-wireframes/08-event-detail.md](02-wireframes/08-event-detail.md)                 |
| 9   | Event editor                   | Create/edit form including the participant sub-editor (event_characters with role + significance), category multi-select, media attachments                                   | [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md)                 |
| 10  | Temporal input control         | Reusable primitive used by character editor, event editor, and relationship editor. Adapts fields per era (CE/BCE/KYA/MYA/BYA) per system-design §7.4                         | [02-wireframes/10-temporal-input.md](02-wireframes/10-temporal-input.md)             |

## Milestone 5 additions

Phase 4 (GitHub milestone 5, issues #42–#50) is the timeline & event management build. The **event** surfaces (list/detail/editor + temporal input, screens 7–10) were already specified in the original pass, so this batch adds the **timeline**, **media**, **collaborator**, and **publish** surfaces around them.

| #   | Screen                   | Purpose                                                                                               | Issue | Wireframe                                                                    |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------- |
| 11  | Timelines list           | Paginated table, filter by visibility / type / publication, sort, search                              | #42   | [02-wireframes/11-timeline-list.md](02-wireframes/11-timeline-list.md)       |
| 12  | Timeline editor          | Create/edit form: span (TemporalInput), type, visibility, biographical subject, publish toggle        | #43   | [02-wireframes/12-timeline-editor.md](02-wireframes/12-timeline-editor.md)   |
| 13  | Timeline detail          | Header + publish; tabs: Events (link/unlink), Periods (read-only stub), Collaborators, Media          | #44   | [02-wireframes/13-timeline-detail.md](02-wireframes/13-timeline-detail.md)   |
| 14  | Collaborators (timeline) | Add by username, role (`viewer/editor/admin`), remove, owner safeguards                               | #50   | [02-wireframes/14-collaborators.md](02-wireframes/14-collaborators.md)       |
| 15  | Media management         | Cross-cutting: upload + external-URL attach dialog, list/grid, ordering, detach vs. delete            | #49   | [02-wireframes/15-media-management.md](02-wireframes/15-media-management.md) |
| 16  | Publish / unpublish      | Cross-cutting pattern: badges, confirm dialogs, owner gating, list filters, visibility-vs-publication | #48   | [02-wireframes/16-publish-workflow.md](02-wireframes/16-publish-workflow.md) |

### The fractal timeline model (resolved)

The schema exposes several ways an event relates to a timeline, and they were previously undocumented and ambiguous (the event editor used `events.timeline_id` as "membership"; issue #44 built on the `timeline_events` junction; `parent_event_id` offered a second, backward nesting axis). This batch resolved them into a **forward, timeline-as-recursion-unit model** — three live mechanisms plus one retired:

| Mechanism                             | Meaning                                                                                                                                                               | Axis          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `events.timeline_id`                  | The event's **primary containing timeline**. RLS source of truth — **unchanged**.                                                                                     | containment   |
| `timeline_events` junction            | **Additional** "also appears in" timelines (e.g. comparative).                                                                                                        | containment   |
| `events.detail_timeline_id` (**new**) | The fractal **drill-down sub-timeline** an event expands into (zoom in).                                                                                              | decomposition |
| ~~`parent_event_id`~~ (**retired**)   | Was event-to-event nesting; **deprecated** ([#180](https://github.com/shaes-farm/time-traveler/issues/180)) — decomposition is forward-only via `detail_timeline_id`. | —             |

This preserves the committed event RLS (`read_events` / `update_events` derive collaborator access from `events.timeline_id`) and the `idx_events_timeline_sort` index, while making "an event opens into a whole sub-timeline" a first-class relationship. **Nesting is forward-only:** the hierarchy is `timeline → events → (event expands into) sub-timeline → events`, recursing on the timeline. Event-to-event nesting (`parent_event_id`) is retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)) — it was a redundant backward reflection of the same hierarchy, permitted cross-timeline integrity holes, and fought the cosmic-scale fetch shape. The model is wired through the event editor ([09](02-wireframes/09-event-editor.md) annotations #5, #15), event detail ([08](02-wireframes/08-event-detail.md) annotations #6, #13), events list ([07](02-wireframes/07-events-list.md) annotations #3, #10), and timeline detail ([13](02-wireframes/13-timeline-detail.md) annotations #3, #5–#8).

### Upstream issues filed during this batch

Per the CLAUDE.md "When you find a spec or upstream bug" rule:

- **[#177](https://github.com/shaes-farm/time-traveler/issues/177)** — add `events.detail_timeline_id` (the new fractal drill-down column). The Expands-into / drill-down affordances across screens 8, 9, and 13 are **blocked** on this migration. _(Confirmed missing against the full migration history 00001–00015.)_
- **[#179](https://github.com/shaes-farm/time-traveler/issues/179)** — `media.storage_path` is `NOT NULL` with no upload/external discriminator, which blocks #49's external-URL embeds. Recommended fix (nullable `storage_path` + a `source` column) documented in [15](02-wireframes/15-media-management.md) schema-gap callout.
- **[#180](https://github.com/shaes-farm/time-traveler/issues/180)** — deprecate `events.parent_event_id` in favor of the forward `detail_timeline_id` model. No data migration (nothing populates it); deprecate the Zod field + `getChildEvents`/`setEventParent` service methods, tombstone the column, drop later. Gated behind #177.
- **[#178](https://github.com/shaes-farm/time-traveler/issues/178) — closed invalid.** Filed in error off a stale read of the initial migrations; `timeline_events.sort_order` **already exists** (migration `00012`, issue #122). Issue #44's "sort_order support" / "deterministic order" wording is therefore correct.

### M5 design decisions (resolved)

- **Event ↔ timeline membership** — forward fractal model above; dedicated `detail_timeline_id` for drill-down (avoids overloading `timeline_id`, preserves RLS).
- **Fractal nesting is forward-only** — `detail_timeline_id` → sub-timeline is the sole decomposition mechanism; `parent_event_id` retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)). Chosen over a dual-axis model because a single recursion unit (the timeline) gives uniform navigation, eliminates cross-timeline parent-link integrity holes, and fits per-level bounded fetch. Ceremony is held down by the "Expands into → ✚ create sub-timeline with inherited defaults" shortcut; the timelines list defaults to top-level (root) timelines so sub-timelines don't clutter it.
- **Timeline event ordering** — editorial `timeline_events.sort_order` (exists since migration `00012`) with a chronological (`events.sort_order_start`) fallback when unset. Drag-to-reorder supported; default-`0` timelines read chronologically.
- **Many-to-many membership kept** — `events.timeline_id` is the event's home timeline (RLS root); `timeline_events` adds appearances in other (e.g. comparative) timelines. Confirmed intentional in the service layer + PRD comparative view.
- **Periods tab on timeline detail** — read-only stub now; full period linking arrives in Phase 6.
- **Visibility vs. publication** — kept strictly orthogonal across all surfaces; never merged into one control. See [16](02-wireframes/16-publish-workflow.md).
- **Collaborator lookup** — by `profiles.username` (no client-queryable email); email-invite delivery is a non-goal this pass.
- **Media scope** — hybrid upload + external embed with association/ordering; no standalone library browser.

## What's deliberately not in scope this pass

> Three items below moved **into scope** in the [Milestone 5 additions](#milestone-5-additions) batch (screens 11–16): timelines CRUD, media management, and collaborator management. They remain listed here, struck, for historical continuity.

- ~~Timelines~~, periods, stories CRUD — timelines now covered (screens 11–13); periods + stories still excluded
- ~~Media library~~ — media management now covered as a cross-cutting surface (screen 15); a standalone reusable library browser is still deferred
- Categories management — still deferred
- Bulk import / export — these are Edge Function flows that need their own design pass
- Admin moderation queue (`content_reports`) — admin-role-only surface, separate audience
- Notifications inbox — needs a separate IA pass
- ~~Collaborator management~~ — now covered for timelines (screen 14); email-invite delivery + org/team model still deferred
- Public reader / explorer views — different audience and aesthetic genre entirely

## Entities and tables this covers

From `supabase/migrations/00001_initial_schema.sql` and `00002_relationships_junctions.sql`:

- `characters` — primary entity
- `events` — primary entity
- `character_relationships` — the focal relationship table (temporally scoped, 11 types, directed pairs)
- `event_characters` — junction with `role` (11 values) and `significance` (4 values); edited inline within the event editor
- `event_categories` — simple junction; edited via multi-select in event editor
- `event_media` — simple junction with `sort_order`; basic attachment UX in event editor
- `character_media` — simple junction with `is_primary`; basic attachment UX in character editor

## Conventions decided in Batch 1 review

The following cross-cutting conventions were resolved during the first design-review batch. They are documented inline in the wireframes they affect; this list serves as an index.

- **Array field editors** (`aliases`, `cultural_context`, `characteristics`, `tags`) — chip input, one element per chip. See [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md) annotation #5.
- **Slug behavior on edit** — slug field visible but locked by default; manual `[edit slug]` unlock surfaces a warning about breaking existing links. Live 300ms debounced regeneration on the create form. See [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md) annotation #3.
- **Empty-state philosophy** — simple per-screen empty states with a single CTA; dashboard zero-state shows a substantive welcome panel with 2–3 CTAs. No dedicated multi-step onboarding flow. See [02-wireframes/02-dashboard.md](02-wireframes/02-dashboard.md) Edge Cases.
- **Sidebar entity counts** — no count badges in the rail; dashboard count cards are the canonical surface. See [02-wireframes/00-app-shell.md](02-wireframes/00-app-shell.md) annotation #7.
- **Live slug preview in editor right rail** — slug regenerates live with a 300ms debounce as the title is typed. Other right-rail fields stay user-controlled. See [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md) annotation #3.
- **Type filter icons + labels** — labels only this fidelity pass; iconography deferred to the visual-design step.

## Decisions resolved in Batch 5 review

Workflow polish — the final batch in the design review. Closes out the 29 in-scope open questions.

- **Publish vs. draft ratio on dashboard** — not surfaced. The Drafts panel covers the actionable "what needs finishing" question; a ratio adds judgment without action. See [02-wireframes/02-dashboard.md](02-wireframes/02-dashboard.md) Open Questions.
- **Activity-feed entries for deleted entities** — omitted. Without soft-delete (`deleted_at` columns; not in the current schema), a tombstone has no nav target. Soft-delete is a separate architectural question, out of scope for this design pass. See [02-wireframes/02-dashboard.md](02-wireframes/02-dashboard.md) Open Questions.
- **"Save and add another" field persistence** — curated set persists between consecutive creates. Character editor: `character_type`, `significance`, `cultural_context`. Event editor: `event_type`, `timeline_id`, `parent_event_id`, `categories`. _(`parent_event_id` later dropped from the set when the field was removed — [#180](https://github.com/shaes-farm/time-traveler/issues/180); current set is `event_type`, `timeline_id`, `categories`.)_ Inline note after save reports what was cleared vs. persisted. See [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md) annotation #9 and [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md) annotation #13.
- **Duplicate event affordance** — deferred until users request it. The persistence-based "Save and add another" handles the bulk-create case. See [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md) annotation #13.
- **Temporal-scope inline timeline on character detail** — formally deferred to fidelity-2 (Tier 4). Needs visual design language for the timeline visual to land first. See [02-wireframes/04-character-detail.md](02-wireframes/04-character-detail.md) Open Questions.

## Decisions resolved in Batch 4 review

Detail-view refinements. Mix of temporal-display semantics and surface-level affordances.

- **Sibling-event ordering** on event detail — chronological proximity (`ABS(this.sort_order_years - sibling.sort_order_years)`); importance is not used as secondary sort. See [02-wireframes/08-event-detail.md](02-wireframes/08-event-detail.md) annotation #7.
- **Range-bar visualization** on event detail — triggered rendering only: uncertainty > 100 years OR range > 1000 years OR spans an era boundary. Trivial CE ranges get no bar. See [02-wireframes/08-event-detail.md](02-wireframes/08-event-detail.md) annotation #5.
- **Duration display** on event detail — always shown when end is set, with era-aware formatting. CE/BCE: "lived 66 years" / "spans 300 years". KYA: "spans 4,000 years". MYA: "spans 79 million years". BYA: rounded significant digits. See [02-wireframes/08-event-detail.md](02-wireframes/08-event-detail.md) annotation #5.
- **Media edit affordances** on event detail — overflow menu (`⋯`) per media item. Edit caption, Reorder, Detach all live in the menu. Clean default; scales as media count grows. See [02-wireframes/08-event-detail.md](02-wireframes/08-event-detail.md) annotation #12.
- **Events tab role grouping** on character detail — keep flat with role label per row. No grouping, no filter added. See [02-wireframes/04-character-detail.md](02-wireframes/04-character-detail.md) Open Questions.
- **JSON editors for `profile_data` / `metadata`** on character editor — keep behind the Advanced disclosure as an escape hatch. Recurring keys promoted to first-class fields in a future iteration. See [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md) Open Questions.

## Decisions resolved in Batch 3 review

List-view refinements. All single-screen decisions; lower stakes than Batches 1–2.

- **Character per-row primary media thumbnail** — hover-card on the name row; no dedicated column. See [02-wireframes/03-characters-list.md](02-wireframes/03-characters-list.md) annotation #10.
- **`has_media` filter on characters list** — kept. Real recurring use case for content authors auditing portrait coverage.
- **Parent-event filter (Show)** — 3-state radio in events-list filter rail: `All` / `Root only` / `Nested only`. _(Superseded by the forward fractal model — replaced with an `All`/`Expandable`/`Leaf` drill-down filter, [#180](https://github.com/shaes-farm/time-traveler/issues/180).)_ See [02-wireframes/07-events-list.md](02-wireframes/07-events-list.md) annotation #10.
- **Categories on events list** — stay on row line 3 (rendered only when present); not promoted to a column. The events table is the densest in the admin; a column claimed by a frequently-empty field isn't a good trade. See [02-wireframes/07-events-list.md](02-wireframes/07-events-list.md) annotation #11.
- **Filter-by-participating-character on events list** — deferred to character-detail Events tab; not added to events-list filter rail.
- **Drafts panel vs. filter on Recent activity** — kept as a separate panel. Distinct intents: "what needs finishing" vs. "where did I leave off."

## Decisions resolved in Batch 2 review

Editor-level decisions resolved during the second design-review batch. These mostly affect the relationships editor (the focal screen) and the event editor.

- **Reciprocal sync depth** — dates and type sync between paired rows; description stays per-side so each character's card can carry perspective-specific text. See [02-wireframes/06-relationships-editor.md](02-wireframes/06-relationships-editor.md).
- **Logical contradiction detection** — warn but never block on save when a contradictory relationship is detected (mutual parent_of, mutual mentor_of, etc.). Authors can override. See [02-wireframes/06-relationships-editor.md](02-wireframes/06-relationships-editor.md).
- **`relationship_role` sub-role design** ([#119](https://github.com/shaes-farm/time-traveler/issues/119)) — Option A chosen: nullable `relationship_role` column with type-conditional CHECK. Sub-roles apply to `family`, `professional`, and `collaboration`; the other 8 types must have NULL role. Concrete sub-role taxonomy documented in the relationships-editor wireframe and in #119.
- **Parent event picker** — searchable combobox with the parent's temporal range shown on selection. A `[ browse hierarchy ]` side-sheet tree view is documented as a future affordance but not built this pass. _(Superseded — the parent-event field was removed entirely under the forward fractal model; decomposition is the "Expands into" sub-timeline field, [#180](https://github.com/shaes-farm/time-traveler/issues/180).)_ See [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md) annotation #5.
- **Primary-media single-primary enforcement** — DB-enforced via partial unique index. Tracked in [#125](https://github.com/shaes-farm/time-traveler/issues/125). Admin UI continues to do atomic swap as a UX flow; the DB index guarantees correctness under races. See [02-wireframes/04-character-detail.md](02-wireframes/04-character-detail.md) Open Questions.
- **Inline-participant editing scalability** — always inline, section scrolls internally when long. No threshold-switch UX. Future "manage in side sheet" affordance documented for 20+-participant events but not built. See [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md) annotation #7.

## Open questions surfaced during inventory

> **All initial inventory-level questions resolved:**
>
> 1. Relationship reciprocity — resolved per-screen in [02-wireframes/06-relationships-editor.md](02-wireframes/06-relationships-editor.md) (Alternative B card-stream with type-grouping). Further refined in Batch 2: reciprocal-edge creation became implicit in the type/role choice via the [#119](https://github.com/shaes-farm/time-traveler/issues/119) sub-role taxonomy.
> 2. Parent event picker — resolved in Batch 2: searchable combobox with documented future hierarchy-browse side-sheet affordance. _(Later superseded — the parent-event field was removed under the forward fractal model, [#180](https://github.com/shaes-farm/time-traveler/issues/180).)_ See [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md) annotation #5.

## Reading order

Read in numeric order: inventory → user flows → individual wireframes → aesthetic notes → fidelity-2 plan. The relationships editor wireframe ([06](02-wireframes/06-relationships-editor.md)) is the most opinionated and benefits from reading the user flows first.

## Design review complete

All 29 in-scope open questions across Batches 1–5 are resolved or formally deferred. Three follow-up issues were filed during the review and integration phases:

- [#119](https://github.com/shaes-farm/time-traveler/issues/119) — `relationship_role` sub-role enum design (concrete proposal documented in the issue and in the relationships editor wireframe). Open; awaiting implementation.
- [#125](https://github.com/shaes-farm/time-traveler/issues/125) — `character_media` single-primary partial unique index. Closed by [#133](https://github.com/shaes-farm/time-traveler/pull/133).
- [#127](https://github.com/shaes-farm/time-traveler/issues/127) — PRD §7.11 vs wireframes reconciliation. **Resolved**: auto-save and the "Shared" status badge adopted into the wireframes (see [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md) annotation #11 and [02-wireframes/03-characters-list.md](02-wireframes/03-characters-list.md) annotation #7); sidebar collapse-to-64px specified (see [02-wireframes/00-app-shell.md](02-wireframes/00-app-shell.md) annotation #8); card view dropped and responsive design deferred via PRD §7.11.1 / §7.11.2 updates.

The wireframes serve as the IA + interaction spec for fidelity-2 (in-tree React in `apps/admin`). Tier-4 deferrals listed in each wireframe's Open Questions section get revisited at that next step.

## Next: fidelity-2

The fidelity-2 implementation plan — design tokens, shadcn-based primitives, Storybook workbench, batched delivery — is documented in [`fidelity-2-plan.md`](fidelity-2-plan.md).

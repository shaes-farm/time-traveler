# Admin Screen Inventory — Core CRUD + Relationships

Status: draft 1 — markdown wireframes phase
Scope: characters + events CRUD, character relationships, the junctions that touch those entities

## What's in scope

| #   | Screen                         | Purpose                                                                                                                                               | Wireframe                                                                            |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0   | App shell                      | Persistent chrome: sidebar nav, topbar (user menu, global search stub), content area, breadcrumb                                                      | [02-wireframes/00-app-shell.md](02-wireframes/00-app-shell.md)                       |
| 1   | Sign in                        | Email + magic-link entry. Out-of-band concern but listed for completeness — minimal annotation only                                                   | [02-wireframes/01-sign-in.md](02-wireframes/01-sign-in.md)                           |
| 2   | Dashboard                      | Entity counts (powered by `get_user_metrics` RPC) + recent activity + quick-create buttons                                                            | [02-wireframes/02-dashboard.md](02-wireframes/02-dashboard.md)                       |
| 3   | Characters list                | Paginated table of the user's characters, filterable by `character_type` and significance, searchable by name/alias                                   | [02-wireframes/03-characters-list.md](02-wireframes/03-characters-list.md)           |
| 4   | Character detail               | Read view: identity, biography, temporal scope (birth/death), aliases, profile media, event participation summary, relationship summary               | [02-wireframes/04-character-detail.md](02-wireframes/04-character-detail.md)         |
| 5   | Character editor               | Create/edit form. Adapts visible fields by `character_type` (species/breed for animal, domain for divine, etc.)                                       | [02-wireframes/05-character-editor.md](02-wireframes/05-character-editor.md)         |
| 6   | Character relationships editor | The hardest screen. Manages temporally-scoped many-to-many edges with 11 type values and directionality semantics. Three alternatives sketched        | [02-wireframes/06-relationships-editor.md](02-wireframes/06-relationships-editor.md) |
| 7   | Events list                    | Paginated table sorted by `sort_order_years`, filterable by `event_type`, importance, timeline, era, character participant                            | [02-wireframes/07-events-list.md](02-wireframes/07-events-list.md)                   |
| 8   | Event detail                   | Read view: title, temporal range, location, type, importance, parent/child events, participating characters, attached media, categories               | [02-wireframes/08-event-detail.md](02-wireframes/08-event-detail.md)                 |
| 9   | Event editor                   | Create/edit form including the participant sub-editor (event_characters with role + significance), category multi-select, media attachments           | [02-wireframes/09-event-editor.md](02-wireframes/09-event-editor.md)                 |
| 10  | Temporal input control         | Reusable primitive used by character editor, event editor, and relationship editor. Adapts fields per era (CE/BCE/KYA/MYA/BYA) per system-design §7.4 | [02-wireframes/10-temporal-input.md](02-wireframes/10-temporal-input.md)             |

## What's deliberately not in scope this pass

- Timelines, periods, stories CRUD — adjacent but excluded to keep this pass focused
- Media library — referenced from character/event editors but the library UX itself is deferred
- Categories management — same reason
- Bulk import / export — these are Edge Function flows that need their own design pass
- Admin moderation queue (`content_reports`) — admin-role-only surface, separate audience
- Notifications inbox — needs a separate IA pass
- Collaborator management — needs a separate IA pass (RLS surface, invite flow)
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

## Open questions surfaced during inventory

1. **Relationship reciprocity.** `character_relationships` is directed (per system-design §3.3) but some types are inherently symmetric (`friendship`, `collaboration`, `enemy`, `rivalry`). Should the admin auto-create the reverse edge on save? Show a "reciprocal" toggle? Resolved per-screen in [02-wireframes/06-relationships-editor.md](02-wireframes/06-relationships-editor.md).
2. **Array field editors.** `aliases`, `cultural_context`, `characteristics`, `tags` are `TEXT[]` columns. Tag-style chip input vs. comma-separated text vs. line-per-value textarea? Default chosen in editors; flagged for review.
3. **Slug edit vs. auto-generate.** Slug is unique per user. On edit, do we surface the slug field, allow override, or auto-regenerate from title with a "regenerate" affordance? Current default: auto-generate on create, editable but locked-by-default on update.
4. **Parent event picker.** `parent_event_id` is a self-FK. With a deeply nested fractal tree, picking a parent is a tree-browse problem, not a flat-select. Default in this pass: searchable single-select with breadcrumb display of the chosen parent's lineage.
5. **Empty-state guidance.** First-time users will see empty lists everywhere. How aggressive should the dashboard onboarding be? Current default: simple "no X yet" empty states with a single create CTA; not running an onboarding flow.

## Reading order

Read in numeric order: inventory → user flows → individual wireframes → aesthetic notes. The relationships editor wireframe ([06](02-wireframes/06-relationships-editor.md)) is the most opinionated and benefits from reading the user flows first.

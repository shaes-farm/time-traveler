# 19 — Story Editor

**Purpose.** Create or edit a story's narrative shell — voice, perspective, prose, tags. Like the timeline editor ([12](12-timeline-editor.md)), it owns only the row fields; the **associations that make a story (events, characters, periods) are managed on the [story detail](20-story-detail.md) page** after the story exists, because event _ordering_ (the heart of a story) needs the populated detail surface.

## Data captured

All `stories` row columns except generated (`search_vector`) and timestamps:

- `title` (required)
- `sub_title`
- `slug` (auto-generated)
- `summary`
- `detail` (long-form narrative, Markdown)
- `narrator_type` (`first_person|third_person|omniscient`)
- `perspective_character_id` (FK `ON DELETE SET NULL`; conditional emphasis for first-person)
- `tags` (`TEXT[]`, chip input)
- `published` (toggle; canonical action on detail — see [16-publish-workflow.md](16-publish-workflow.md))

## Primary actions

- Save (create → `useCreateStory`; edit → `useUpdateStory`)
- Cancel / discard (unsaved-changes guard)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Stories ▸ New story                                 [ Cancel ] [ Save ]     │
│                                                          Draft saved 4:20 PM │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Identity                           │  Slug                            │  │
│  │  ───────────────────────────────    │  the-curies-quest   [ edit slug ]│  │
│  │  Title *                            │                                  │  │
│  │  [ The Curies' Quest          ]     │  Narrative voice                 │  │
│  │  Sub-title                          │  ───────────────────────────     │  │
│  │  [ A radium love story        ]     │  Narrator                        │  │
│  │                                     │  [ Third-person            ▾]    │  │
│  │  Summary                            │                                  │  │
│  │  ┌─────────────────────────────┐    │  Perspective character           │  │
│  │  │ One-paragraph hook…         │    │  [ Marie Curie  👤         ▾]    │  │
│  │  └─────────────────────────────┘    │   ⓘ whose eyes we see through    │  │
│  │                                     │     (required for first-person)  │  │
│  │  Detail (narrative)                 │                                  │  │
│  │  ┌─────────────────────────────┐    │  Published                       │  │
│  │  │ Full narrative, Markdown…   │    │  ◯ Draft (publish from detail)   │  │
│  │  │                             │    │                                  │  │
│  │  │                             │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  Tags                               │                                  │  │
│  │  [ tragedy ×] [ war ×] [ + tag ]    │                                  │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Same two-column editor shell** as the timeline/character/event editors. Left: narrative content. Right: voice + identity metadata. Slug behavior matches the others ([05](05-character-editor.md) annotation #3): live debounced regen on create, locked-with-unlock on edit; uniqueness `(user_id, slug)` via `stories_slug_idx`.
2. **Narrator + perspective character are the story's defining choice**, so they sit together in a "Narrative voice" block on the right rail. `narrator_type` is a three-value select.
3. **Perspective character is conditional in emphasis, not presence.** Per PRD §4.6.2, when `narrator_type = first_person` the `perspective_character_id` _should_ be set (whose eyes) and the field is required; for third-person/omniscient it's optional (it can still mark a focal character). The picker is a searchable combobox over the user's characters, rendering the **finalized character-type identity** (icon + tint, [03-aesthetic-notes.md](../03-aesthetic-notes.md) § _Character type as identity_). FK is `ON DELETE SET NULL` — a deleted character just clears the field.
4. **`detail` is the long-form narrative** (Markdown per PRD §4.6.1), given a tall textarea — this is the one editor where prose is the primary content, not metadata. `summary` is the short hook.
5. **Tags are a chip input** over the `tags TEXT[]` column (genre/thematic/geographic, PRD §4.6.6). Free-form — **not** Categories (categories don't attach to stories this pass; see [24-category-management.md](24-category-management.md)). Same chip pattern as character aliases ([05](05-character-editor.md) annotation #5).
6. **Publish is a Draft toggle here; the canonical publish lives on detail** — same rationale as the timeline editor ([12](12-timeline-editor.md) annotation #5): you usually publish a story after arranging its events. Uses `StatusBadge` semantics ([16-publish-workflow.md](16-publish-workflow.md)).
7. **No event/character/period association in this editor.** Those live on [story detail](20-story-detail.md) — event ordering especially needs the populated surface. On successful create, redirect to detail (where the author immediately starts adding events).
8. **Auto-save to draft every 30s** + **unsaved-changes guard**, identical to the other editors (PRD §7.11.3).

## Save flow

1. Validate client-side (Zod): `title` required; `narrator_type` in enum; `perspective_character_id` required when `first_person`.
2. `useCreateStory` / `useUpdateStory` (optimistic).
3. On success, redirect to **story detail** (`/stories/[slug]`).

## Edge cases

- **First-person without a perspective character.** Hard validation error: "First-person stories need a perspective character (whose eyes)." Save blocked until set or voice changed.
- **Switching `first_person` → omniscient with a perspective set.** Keep the value (it's still a valid focal character) but drop the "required" treatment; no destructive clear.
- **Perspective character later deleted.** FK `ON DELETE SET NULL`; detail/editor show an empty picker on next open.
- **Slug collision.** Caught via `stories_slug_idx`; `resolveCollision` appends a suffix, surfaced inline.

## Open questions

- **Markdown preview / rich editor** for `detail` — out of scope this pass (plain textarea + Markdown, consistent with other long-form fields). Revisit if authors ask. Tier 4.
- **"Save and add another"** — less useful for stories than events (you don't bulk-create tellings); omitted unless demand surfaces.

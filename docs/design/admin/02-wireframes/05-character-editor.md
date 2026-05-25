# 05 — Character Editor

**Purpose.** Create or edit a character. The most type-adaptive form in the app — fields appear and disappear based on `character_type`.

## Data captured

All character row columns except generated ones (`search_vector`) and timestamps:

- name (required)
- character_type (required, 7-enum)
- slug (auto-generated, overridable)
- biography
- aliases (TEXT[])
- cultural_context (TEXT[])
- physical_description
- type-specific: species, breed (animal only), domain (divine only)
- significance (4-enum)
- birth_temporal, death_temporal (via temporal input control)
- profile_data (JSONB — power-user only, hidden behind disclosure)
- metadata (JSONB — same)
- published (separate save action)

## Primary actions

- Save (creates new or updates existing)
- Save and add another (create flow only)
- Cancel
- Discard changes (when dirty)

## Layout — create flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Characters ▸ New character                          [ Cancel ] [ Save ▾ ]   │
│                                                                              │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐  │
│  │  Identity                           │  Slug                            │  │
│  │  ───────────────────────────────    │  ───────────────────────────     │  │
│  │  Name *                             │  marie-curie  [ regenerate ]     │  │
│  │  [ Marie Curie                  ]   │  Auto-generated from name.       │  │
│  │                                     │                                  │  │
│  │  Character type *                   │  Significance                    │  │
│  │  ( ) Human       ( ) Animal         │  ○ Low   ○ Medium                │  │
│  │  ( ) Myth.       ( ) Fictional      │  ○ High  ● Critical              │  │
│  │  ( ) Org.        ( ) Divine         │                                  │  │
│  │  ( ) Artifact                       │  Published                       │  │
│  │                                     │  ◯ Draft / publish on save      │  │
│  │  Aliases                            │                                  │  │
│  │  [ Maria Skłodowska ×] [Madame Curie│×]                                │  │
│  │  [ + Add alias                  ]   │                                  │  │
│  │                                     │                                  │  │
│  │  Cultural context                   │                                  │  │
│  │  [ Polish ×] [ French ×]            │                                  │  │
│  │  [ + Add context                ]   │                                  │  │
│  │                                     │                                  │  │
│  │  Biography                          │                                  │  │
│  │  ┌─────────────────────────────┐    │                                  │  │
│  │  │ Polish-French physicist and │    │                                  │  │
│  │  │ chemist. Pioneer of …       │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  Physical description               │                                  │  │
│  │  ┌─────────────────────────────┐    │                                  │  │
│  │  │ Dark hair, gray eyes …      │    │                                  │  │
│  │  └─────────────────────────────┘    │                                  │  │
│  │                                     │                                  │  │
│  │  Temporal scope                     │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  Birth date    [ + Add date    ]    │                                  │  │
│  │  Death date    [ + Add date    ]    │                                  │  │
│  │                                     │                                  │  │
│  │  Profile media                      │                                  │  │
│  │  ───────────────────────────────    │                                  │  │
│  │  ┌────────────────────────────────┐ │                                  │  │
│  │  │   Drop image or click to upload│ │                                  │  │
│  │  └────────────────────────────────┘ │                                  │  │
│  │                                     │                                  │  │
│  │  ▸ Advanced (profile_data, metadata)│                                  │  │
│  └─────────────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Type-adaptive variations

**Animal** — Identity section grows two fields:

```
  Species    [ Tyrannosaurus rex            ]
  Breed      [ (n/a for non-domesticated)   ]
```

**Divine** — Identity section grows one field, biography label shifts:

```
  Domain     [ Sky, thunder, gods            ]
  Biography  (becomes "Mythological account")
```

Birth/death temporal for divine and mythological characters is often blank or "eternal." The temporal control accepts empty; the detail view renders "—" for these.

**Organization** — Adjusts copy: birth_temporal renders as "Founded", death_temporal as "Dissolved."

**Artifact** — Same as organization: "Created" / "Destroyed". May also have its own `cultural_context` semantics (provenance).

## Annotations

1. **Two-column layout.** Left column is the main form. Right column is identity-adjacent metadata: slug, significance, publish state. Right column is fixed-width (~280px) and doesn't scroll.
2. **Character type is a radio set, not a select.** With only 7 options and meaningful labels, radios are scannable and the visual shows the user every type at once. Picking type early matters because it controls the form shape.
3. **Slug auto-generation is live with a 300ms debounce.** As the user types the name, the slug regenerates from it. Once the user edits slug manually, the live link is broken and `[regenerate]` is the only path back. On the **edit form** for an existing character, the slug field is visible but **locked by default**; clicking the `[edit slug]` affordance unlocks it with a warning: "Changing the slug will break existing links to this character." (Decided in Batch 1 review.)
4. **Slug collision** is handled by the existing `resolveCollision` utility (per recent commits). If the auto-generated slug already exists for this user, append `-2`, `-3`, etc. Show the resolved slug in the field so the user knows.
5. **Aliases and cultural_context use chip input.** Each chip is a separate array element. Backspace deletes the last chip. Comma or Enter adds a new chip from the input.
6. **Temporal scope uses the temporal input control** ([10-temporal-input.md](10-temporal-input.md)). Empty state is `[ + Add date ]`; populated state shows the formatted display + opens the control on click.
7. **Profile media is single-image in this view.** Multiple images live in the Media tab on the detail view. The editor sets the primary; additional media is a detail-view concern.
8. **Advanced section** (collapsed by default) exposes `profile_data` and `metadata` as JSON editors. Power users only — most users will never expand this.
9. **Save button is split.** Primary action: "Save". Dropdown: "Save and add another" (create flow only), "Save as draft" if currently publishing, "Save and publish" if currently draft. **"Save and add another" persists a curated set** (Batch 5 decision Q3): `character_type`, `significance`, `cultural_context` carry forward to the next blank form. Cleared: name, slug, biography, aliases, physical_description, dates, profile media. An inline note appears after save: "Cleared: name, biography, aliases, dates, media. Persisted: type, significance, cultural context."
10. **Dirty state warning.** Cancel with unsaved changes prompts: "Discard unsaved changes?"
11. **Auto-save to draft state every 30 seconds** (per PRD §7.11.3; #127 reconciliation). The top-right of the editor toolbar shows `Draft saved at H:MM PM` after each successful auto-save. Auto-save fires only when the form is dirty; clean forms are not re-saved. The Save button is still required to transition Draft → Published — auto-save never publishes. Concurrent edits from another tab trigger a refresh prompt rather than silently overwriting.

## Edge cases

- **Switching character type mid-edit** clears type-specific fields with a warning: "Species and breed will be cleared. Continue?"
- **Slug uniqueness failure** (race condition: someone else's character with same user_id? — shouldn't happen, but defense in depth) surfaces a friendly "That slug is taken; choose another or regenerate."
- **Network failure during save.** TanStack Query rolls back optimistic insert; toast offers retry.
- **Required-field empty on submit.** Inline errors at field; focus jumps to first invalid.
- **Image upload mid-save.** Image upload completes in background; if user navigates away before upload completes, finish the upload but surface "image upload failed, retry from detail view" toast.
- **Editing another user's character (collaborator).** This screen is not used — the entity is read-only for non-owners. Detail view hides the Edit action.

## Open questions

> **Resolved (Batch 1):** Right-column live updates — slug regenerates live with a 300ms debounce as the title is typed. Other right-rail fields (significance, importance, publish toggle) are user-controlled and stay static.
>
> **Resolved (Batch 4):** Long-term home for `profile_data` / `metadata` JSON editors — keep behind the Advanced disclosure as an escape hatch. Recurring keys should be promoted to first-class form fields and dedicated schema columns in a future iteration, once usage patterns emerge from real authoring.
>
> **Resolved (Batch 5):** "Save and add another" field persistence — a curated set persists between consecutive creates (`character_type`, `significance`, `cultural_context`). Other fields clear. Inline note after save reports what was cleared vs. persisted. See annotation #9.

_All initial open questions resolved. Future questions may be added as the wireframe is refined._

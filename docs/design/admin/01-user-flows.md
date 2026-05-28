# Admin User Flows — Core CRUD + Relationships

Five flows that exercise the hard edges of the data model. Each is numbered so wireframes can refer back.

## Flow A — Create a character (happy path)

Persona: Biographer creating "Marie Curie" before adding events.

1. From the **Dashboard** or **Characters list**, click **New character**.
2. **Character editor** opens. User picks `character_type = human` first; the form re-renders to show human-specific fields (no species/breed/domain).
3. User fills name "Marie Curie". Slug auto-generates as `marie-curie`. User leaves slug locked.
4. User enters biography, aliases (chip input: "Maria Skłodowska", "Madame Curie"), cultural context (chip input: "Polish", "French").
5. User opens **Birth temporal** popover (the temporal input control). Era defaults to CE; user picks year 1867, month 11, day 7, precision `exact`.
6. User opens **Death temporal** popover similarly: 1934-07-04, precision `exact`.
7. User uploads a profile image. Image lands in `media`; junction row in `character_media` with `is_primary = true` is created on save.
8. User clicks **Save**. Optimistic insert via TanStack Query; on success, navigates to **Character detail**.

Edge cases: slug collision (handled by `resolveCollision` utility — already shipped per recent commits); image upload failure (event saves, media does not — user can retry attachment from detail view).

## Flow B — Create a fractal event with character participants

Persona: Historian adding "Discovery of polonium (1898)" as a child of "Curies' radium research (1895–1898)".

1. From **Events list**, click **New event**.
2. **Event editor** opens. User enters title "Discovery of polonium".
3. User opens **Parent event** picker. Searches "radium", picks "Curies' radium research". Picker displays the parent's temporal range so user can sanity-check that the child date fits.
4. User picks `event_type = discovery`, `importance = 8`.
5. User enters **Start temporal**: 1898 CE, precision `exact`. Leaves end temporal empty (point event).
6. User opens **Participants** sub-editor. Searches for "Curie", adds "Marie Curie" (role: `protagonist`, significance: `primary`). Searches "Pierre", adds "Pierre Curie" (role: `protagonist`, significance: `primary`).
7. User multi-selects categories: "Physics", "Discovery".
8. User saves. The service-layer `createEventWithRelations` (per system-design §5.3) issues the event insert plus three junction inserts in parallel.

Edge cases:

- **Cycle prevention.** If user picks a parent that would create a cycle, the editor blocks save with an inline error (cycle detection is service-layer per system-design §3.4 note on self-referential FK cycles).
- **Temporal mismatch.** If the child's date falls outside the parent's range, show a soft warning but allow save — sometimes the parent has fuzzy bounds.
- **Junction insert partial failure.** Per system-design §5.3, these multi-step ops are not transactional. If a junction insert fails, the event exists without that relation; toast offers a retry.

## Flow C — Build a character relationship across two characters with temporal scope

Persona: Biographer adding the Marie/Pierre marriage relationship.

1. From **Character detail** ("Marie Curie"), click into the **Relationships** section.
2. **Relationships editor** opens scoped to Marie. User clicks **Add relationship**.
3. Picker: pick the other character ("Pierre Curie"). User searches by name.
4. Pick `relationship_type`. User picks `family`, then picks `spouse` from the inline sub-role radios that appear (the family / professional / collaboration types reveal a sub-role chooser per issue #119; `spouse` is one of 16 family sub-roles).
5. Enter description: "Married 1895; collaborated on radioactivity research until Pierre's death in 1906."
6. Enter **Start temporal**: 1895 CE.
7. Enter **End temporal**: 1906 CE (Pierre's death). System-design treats end-of-relationship as optional — leaving it empty means "ongoing or unknown."
8. **Reciprocity is implicit.** There is no longer a "create the reverse edge" checkbox — the wireframe's Batch 2 Q1 decision made reciprocal-edge creation automatic based on the type/role choice. `family/spouse` is symmetric, so on save the service writes two rows: `(Marie, Pierre, family, spouse)` and `(Pierre, Marie, family, spouse)`. Paired sub-roles like `parent`/`child` write the inverted role on the reverse row; symmetric flat types like `friendship` write a same-type reverse. See `02-wireframes/06-relationships-editor.md` for the full taxonomy.
9. User adds a second relationship for the same pair: `relationship_type = collaboration`, same dates. The unique index `(character_id, related_character_id, relationship_type, relationship_role)` permits this because the type/role tuple differs.

Edge cases:

- **Duplicate type.** If the user picks a type that already exists for this pair, the DB rejects via the unique index. Editor catches the constraint violation and surfaces "Marie already has a `family` relationship with Pierre — edit the existing one?" with a link.
- **Self-relationship.** DB rejects (`CHECK (character_id != related_character_id)`). Editor disables the "self" option in the picker before submit.
- **Asymmetric types.** `mentor_student`, `creator_creation`, `owner_pet`, `trainer_trainee`, `worship` are directional. The selector renders these as **paired radios** under the Asymmetric fieldset ("Marie mentors Pierre" / "Pierre mentors Marie") so direction is picked explicitly. No reciprocal row is created for asymmetric types — the chosen direction is the only row stored.

## Flow D — Edit a character that owns published events (permission edge)

Persona: Storyteller realizes a character's birthdate was wrong; some events using that character are already published.

1. User navigates to **Character detail** → **Edit**.
2. **Character editor** preloads. User opens **Birth temporal** popover, corrects year.
3. On save, the character record updates. No cascade to event temporal data (events are independent dates), but the **Character detail** view re-renders with the new birth date.
4. The detail view recomputes the **Event participation timeline** subsection — events that previously appeared to occur "before birth" may now correctly fall after.
5. RLS-wise this is the owner editing their own record; nothing collaborator-related fires.

Edge case worth surfacing in the wireframe: when the new birth/death range conflicts with the timestamps of events the character participates in, the detail view should flag those events visually (chip + warning icon) but never block the edit. Data is sometimes wrong; the admin lets you fix it.

## Flow E — Delete a character that's wired into events

Persona: Investigator deduplicating characters; "John Smith (duplicate)" needs to go.

1. User navigates to **Character detail** for the duplicate.
2. User opens the **Danger zone** disclosure at the bottom of the detail view.
3. Clicks **Delete character**.
4. Confirm dialog reports the blast radius: "This will remove 3 event participations, 2 relationships, and 1 media association. The events and other characters remain. This cannot be undone."
5. User confirms with a typed match of the character name (or a checkbox; design choice TBD in the wireframe).
6. Delete fires via `supabase.from('characters').delete().eq('id', ...)`. `ON DELETE CASCADE` on all junctions handles the cleanup. RLS check: owner OR admin (cascading deletes do not re-check RLS on each junction row).

Edge case: if the character is referenced by `timelines.subject_character_id` (biographical timeline) or `stories.perspective_character_id`, those FKs are `ON DELETE SET NULL` per the schema. The confirm dialog should call this out separately: "Will also clear the subject character on 1 biographical timeline."

## What these flows do not cover

- Bulk operations (multi-select delete, bulk publish, bulk export). Reserved for a later pass.
- Cross-user collaboration. The relationships editor assumes single-user authoring; collaborator edits per timeline are a separate flow.
- Realtime co-presence. Supabase Realtime is in the stack but no co-presence UX is designed yet.
- Search across all entity types. Global search is in the topbar wireframe but its result view isn't designed.

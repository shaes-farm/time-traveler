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

## Flow B — Create an event with character participants

Persona: Historian adding "Discovery of polonium (1898)" to the Curie biography timeline. _(Fractal decomposition — making an event open into a sub-timeline — is its own flow; see Flow G. Under the forward model, an event is not created "as a child of" another event.)_

1. From **Events list**, click **New event**.
2. **Event editor** opens. User enters title "Discovery of polonium".
3. User sets **Primary timeline** = "Curie biography" (the event's home; this is what RLS and the default timeline list key off). Optionally adds an **Also appears in** timeline (e.g. "Women in science") via the junction.
4. User picks `event_type = discovery`, `importance = 8`.
5. User enters **Start temporal**: 1898 CE, precision `exact`. Leaves end temporal empty (point event).
6. User opens **Participants** sub-editor. Searches for "Curie", adds "Marie Curie" (role: `protagonist`, significance: `primary`). Searches "Pierre", adds "Pierre Curie" (role: `protagonist`, significance: `primary`).
7. User multi-selects categories: "Physics", "Discovery".
8. User saves. The service-layer `createEventWithRelations` (per system-design §5.3) issues the event insert plus the junction inserts in parallel.

Edge cases:

- **No parent-event step.** Event-to-event nesting is retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)); there is no parent picker and no parent-range/cycle check at create time. To place this event inside a larger structure, either it shares a timeline with related events (chronological neighbors) or a larger event **expands into** a sub-timeline that contains it (Flow G).
- **Sub-timeline span mismatch.** Only relevant when this event is later added to a sub-timeline whose declared span doesn't cover its date — a soft, non-blocking warning (declared span is editorial). See Flow G.
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
- **Asymmetric types.** `mentor_student`, `creator_creation`, `owner_pet`, `trainer_trainee`, `worship` are directional. The selector renders one radio per asymmetric type and stores the row with the focal character as `character_id` and the other character as `related_character_id` (the focal-is-subject convention). No reciprocal row is created — direction lives in column position. To record the reverse direction (e.g., "Pierre mentored Marie"), the author switches to Pierre's editor and creates the relationship from there.

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

## Milestone 5 flows — Timelines, fractal zoom, collaboration, publishing

Four flows added for the Phase 4 timeline & event build (screens 11–16). They depend on the **fractal model** resolved in this batch — read this primer first.

### The fractal model in one paragraph

A timeline **contains** events; an event can **decompose into** a timeline. These are different axes, and nesting is **forward-only** — the timeline is the recursion unit ([#180](https://github.com/shaes-farm/time-traveler/issues/180)). Containment: an event's primary home is `events.timeline_id`, and it can additionally appear in other timelines via the `timeline_events` junction. Decomposition (the fractal zoom): an event expands into its own sub-timeline via `events.detail_timeline_id` (new column, [#177](https://github.com/shaes-farm/time-traveler/issues/177)). There is **no** event-to-event nesting — `parent_event_id` is retired; you don't make one event a child of another, you make an event open into a sub-timeline that holds the finer events. Concretely: the "Cosmic history" timeline _contains_ the event "Earth forms"; that event _expands into_ a separate "Evolution of life on Earth" timeline, which contains its own events ("first cells", "Cambrian explosion"), one of which might itself expand further. Zooming in follows `detail_timeline_id`; zooming out follows the inverse lookup shown on [timeline detail](02-wireframes/13-timeline-detail.md).

## Flow F — Create a timeline and populate it with events

Persona: Biographer starting a "Curie scientific biography" timeline before arranging events into it.

1. From the **Dashboard** or **Timelines list**, click **New timeline**.
2. **Timeline editor** opens. User enters title "Curie scientific biography". Slug auto-generates.
3. User picks `timeline_type = biographical`; the form reveals the required **Subject character** picker. User selects "Marie Curie".
4. User sets **Visibility = private** (the default) and leaves **Published = Draft** — publication happens later, from the detail page, after the events are arranged.
5. User opens **Start span** (TemporalInput): 1867 CE; **End span**: 1934 CE. Sets **Scale** = "a single lifetime".
6. User clicks **Save** (`useCreateTimeline`). Redirects to **Timeline detail**.
7. On the **Events tab**, the user clicks **+ Link event**, searches "polonium", and links "Discovery of polonium" — it appears as `linked`. Repeats for the other Curie events.
8. For events that don't exist yet, the user uses the **+ Link event ▾ → Create new event in this timeline** split-button, which opens the [event editor](02-wireframes/09-event-editor.md) with this timeline pre-filled as the **primary** timeline (so the new event lands as `home`).

Edge cases: biographical type with no subject chosen blocks save; events outside the declared span surface a non-blocking advisory on the detail header (not an error — declared span is editorial).

## Flow G — Drill an event down into a sub-timeline (fractal zoom)

Persona: Cosmologist building "Cosmic history" who wants the "Earth forms" event to open into its own detailed timeline.

1. From the **Cosmic history** timeline detail → **Events tab**, the user opens the "Earth forms" **event detail**.
2. In the event's **Timelines** block, under **Expands into**, the user picks (or, via the `↗` shortcut, creates) the sub-timeline "Evolution of life on Earth". This sets `events.detail_timeline_id`.
3. A `⤵` marker now appears on the "Earth forms" row in the Cosmic history Events tab and on its event detail. Clicking `⤵` navigates **into** the sub-timeline (zoom in).
4. On the **"Evolution of life on Earth"** timeline detail, the header shows the inverse: `ⓘ Details the event: ↗ "Earth forms" (in Cosmic history)` — the zoom-out path back up the hierarchy.
5. The user populates the sub-timeline with its own events ("first cells", "Cambrian explosion"), any of which can itself expand further.

Edge cases:

- **Fractal cycle.** The picker (and a service-layer check) prevents an event from expanding into a timeline that transitively contains the event itself. This is the cycle guard that formerly lived on the parent-event picker, now applied to `detail_timeline_id`.
- **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177).** The Expands-into field is hidden until the `detail_timeline_id` column ships. There is no `parent_event_id` fallback — event-to-event nesting is retired ([#180](https://github.com/shaes-farm/time-traveler/issues/180)); until #177 lands, decomposition simply isn't available and events are organized by timeline membership alone.

## Flow H — Share a timeline with a collaborator

Persona: Owner inviting a co-author to edit a timeline.

1. From **Timeline detail** → **Collaborators tab**, the owner clicks **+ Add collaborator**.
2. The owner types `@irenejc`. The dialog resolves it against `profiles` and confirms "✓ Irène Joliot-Curie". (Lookup is by **username** — there's no client-queryable email; see [14-collaborators.md](02-wireframes/14-collaborators.md) annotation #2.)
3. The owner picks **role = editor** (read + edit events; cannot delete or publish) and confirms. `addCollaborator` writes the `timeline_collaborators` row; Irène gains access immediately under RLS.
4. To change a role, the owner uses the inline `role ▾` select on the collaborator's row (`updateCollaboratorRole`, applied immediately). To remove, `[×]` with a confirm (`removeCollaborator`).
5. For the timeline to be reachable by collaborators in listings, its **visibility** should be `shared` (set in the editor) — distinct from publication.

Edge cases: adding the owner or an existing collaborator is blocked at validation; the owner row is rendered locked and can never be removed; there is no email-invite delivery this pass (collaborators are added directly).

## Flow I — Publish a timeline and its events

Persona: Author taking a finished biography live.

1. From **Timeline detail**, the owner clicks **Publish** in the header. A **confirm dialog** explains the consequence; on confirm, `published = true` and `published_at = now()`.
2. The header badge flips to `✓ Published`; the timelines-list row shows the same badge.
3. Publication does **not** cascade to the timeline's events — each event publishes independently. The Events tab surfaces a non-blocking note: "3 events in this timeline are still drafts."
4. The owner opens each draft event and publishes it from the event-detail header (same confirm pattern; `publishEvent` lands in PR #174).
5. **Visibility is unchanged by publishing.** A `private` timeline that is published is "done" but still owner-only; making it reachable to others is the separate `visibility` axis. See [16-publish-workflow.md](02-wireframes/16-publish-workflow.md).

Edge cases: a collaborator-editor sees no Publish control (publishing is owner-only); unpublishing clears `published_at` to NULL and narrows RLS read access on the next request.

## Milestone 7 flows — Stories, periods, categories

Three flows for the Phase 6 build (screens 18–24). The data layer (services/hooks/stores) already exists; these exercise the new UI and the resolved model decisions.

## Flow J — Author a story and order its events narratively

Persona: Storyteller writing "The Curies' Quest," a third-person telling that opens in media res.

1. From the **Stories list**, click **New story**.
2. **Story editor** opens. User enters title + sub-title, picks `narrator_type = third_person`, sets perspective character "Marie Curie" (rendered with her human type identity). Writes the summary + Markdown narrative; adds tags `tragedy`, `triumph`. Saves → redirect to **story detail**.
3. On **story detail → Events tab**, user clicks **+ Add event** and links the Curie events. Each lands at the end of the list.
4. User **drags (`⠿`) to set narrative order** — putting "Leaving Poland (1891)" _after_ "Discovery of polonium (1898)" as a flashback. The row shows order-index 6 but date 1891, so the non-chronological telling stays legible. This writes `story_events.sort_order` ([#183](https://github.com/shaes-farm/time-traveler/issues/183)).
5. On the **Characters tab**, user assigns roles (`protagonist` for Marie + Pierre, `supporting` for Becquerel). On **Periods**, associates the "Belle Époque" period.
6. User publishes from the detail header (owner-only; confirm dialog).

Edge cases:

- **Blocked on [#183](https://github.com/shaes-farm/time-traveler/issues/183).** Until `story_events.sort_order` ships, events render chronologically and the drag handle is hidden — the rest of the flow works.
- **First-person without perspective character** is blocked at save (Flow's voice is third-person here, so N/A).
- An event linked here is only _referenced_ — it keeps its home timeline and can appear in other stories with a different order/interpretation (PRD §4.6.3).

## Flow K — Build a period hierarchy and overlay it on a timeline

Persona: Paleontologist structuring deep time.

1. From the **Periods list**, create "Mesozoic Era" (252–66 MYA, significance `critical`, characteristics `reptiles`, `warm climate`). Save → period detail.
2. Create "Jurassic" (201–145 MYA); in the editor, set **Parent period = Mesozoic Era** (the picker shows Mesozoic's range so the child span can be sanity-checked; it excludes Mesozoic's descendants to prevent cycles).
3. On **Jurassic detail**, the breadcrumb reads `Mesozoic Era ▸ Jurassic`; the Hierarchy panel shows the parent.
4. On the **Overlaid timelines tab**, user clicks **+ Overlay a timeline** and adds "Evolution of life on Earth" (`period_timelines`).
5. The **Events in range tab** now lists events whose dates fall within 201–145 MYA — **computed by date, scoped to the overlaid timeline** — without anyone linking events to the period (span-overlay model; no `period_events`).

Edge cases:

- **Child span outside parent range** → soft, non-blocking warning (period bounds are sometimes fuzzy).
- **Deleting Mesozoic** cascades to its child periods (`ON DELETE CASCADE`); the Danger-zone confirm states the blast radius (events/timelines unaffected — the period only overlaid them).

## Flow L — Organize the category taxonomy

Persona: Archivist tidying tags.

1. From **Categories**, the tree shows roots (Science, War, Art). User expands **Science → Physics** and clicks **+ Add child** under Physics, creating "Quantum Mechanics" with a color + icon.
2. User realizes "Relativity" is mis-filed under War; selects it and changes **Parent → Physics** in the inspector (the picker excludes Relativity's own descendants — cycle prevention). The subtree moves.
3. User deletes the redundant "Misc" category. Because it has children and tagged events, the **delete policy dialog** appears: blast radius ("2 child categories, 7 events"), with **Reparent children first** (recommended) vs. **Delete subtree**. User reparents to root, then deletes only "Misc."

Edge cases:

- Categories tag **events only** this pass; assignment happens in the event editor, not here.
- No publish state — categories are taxonomy, always live for their owner.

## What these flows do not cover

- Bulk operations (multi-select delete, bulk publish, bulk export). Reserved for a later pass.
- ~~Cross-user collaboration~~ — timeline collaboration is now covered (Flow H). The character relationships editor still assumes single-user authoring; collaborative _editing of the same record_ in real time is separate.
- Realtime co-presence. Supabase Realtime is in the stack but no co-presence UX is designed yet.
- Search across all entity types. Global search is in the topbar wireframe but its result view isn't designed.

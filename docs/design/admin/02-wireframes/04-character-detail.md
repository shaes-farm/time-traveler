# 04 — Character Detail

**Purpose.** Read view of a single character. Shows everything stored on the character row plus computed summaries of event participation and relationships. The entry point for most editing flows.

## Data shown

- Identity: name, character_type, slug
- Bio: biography, aliases, cultural_context, physical_description
- Type-specific: species/breed (animal), domain (divine), etc.
- Temporal: birth_temporal, death_temporal
- Significance
- Profile media (`character_media` with `is_primary = true`)
- Event participation summary (`event_characters` joined with `events`)
- Relationship summary (`character_relationships` in both directions)
- Published state, timestamps

## Primary actions

- Edit character (→ character editor)
- Publish / unpublish
- Delete (in danger zone)
- Add relationship (→ relationships editor, scoped to this character)
- Jump to participating event
- Set/replace primary media

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Characters ▸ Marie Curie                            [Edit] [Publish ✓] [⋯]  │
│                                                                              │
│  ┌──────────┐  Marie Curie                                                   │
│  │          │  Human · Critical significance                                 │
│  │  [photo] │  marie-curie · 1867 CE — 1934 CE                               │
│  │          │  Also known as: Maria Skłodowska, Madame Curie                 │
│  │  primary │  Polish · French                                               │
│  └──────────┘                                                                │
│  [ Replace ]                                                                 │
│                                                                              │
│  ┌──── Overview ────┬── Events (12) ──┬── Relationships (4) ──┬── Media ──┐  │
│  ╞══════════════════╧═════════════════╧═══════════════════════╧═══════════╡  │
│  │                                                                        │  │
│  │  Biography                                                             │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  Polish-French physicist and chemist. Pioneer of radioactivity         │  │
│  │  research. First woman to win a Nobel Prize, first person to win in    │  │
│  │  two scientific fields. Discovered polonium and radium with her        │  │
│  │  husband Pierre Curie.                                                 │  │
│  │                                                                        │  │
│  │  Physical description                                                  │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  Dark hair, gray eyes, slight build. Often photographed with           │  │
│  │  laboratory glassware.                                                 │  │
│  │                                                                        │  │
│  │  Temporal scope                                                        │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  Birth   November 7, 1867 CE  (exact)                                  │  │
│  │  Death   July 4, 1934 CE  (exact)                                      │  │
│  │  Lived 66 years.                                                       │  │
│  │                                                                        │  │
│  │  Metadata                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  Created  2026-04-12  ·  Updated  2026-05-21  ·  Slug  marie-curie     │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ▸ Danger zone                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tab content sketches

### Events tab

```
  Participating events (12)         [ + Add to event ] [ Sort: chronological ▾ ]
  ──────────────────────────────────────────────────────────────────────────
  ⌒ 1867 · Birth (referenced; not an event row)
  ↓
  ⌒ 1891 CE  Sklodowska arrives in Paris       protagonist · primary
  ⌒ 1895 CE  Marriage to Pierre Curie          protagonist · primary
  ⌒ 1898 CE  Discovery of polonium             protagonist · primary
  ⌒ 1898 CE  Discovery of radium               protagonist · primary
  ⌒ 1903 CE  Curies share Nobel in Physics     protagonist · primary
  ⌒ 1906 CE  Pierre Curie killed               witness    · primary
  ⌒ 1911 CE  Solo Nobel in Chemistry           protagonist · primary
  ⌒ 1914 CE  Curie deploys mobile X-ray units  protagonist · primary
  ↓
  ⌒ 1934 · Death (referenced; not an event row)
```

### Relationships tab

```
  Relationships (4)                          [ + Add relationship ]
  ──────────────────────────────────────────────────────────────────────────
  ▾ Family
  Pierre Curie               family · spouse        1895 — 1906 CE
  Irène Joliot-Curie         family · daughter      1897 — 1934 CE
  ▾ Professional
  Pierre Curie               collaboration          1895 — 1906 CE
  Henri Becquerel            professional           1896 — 1908 CE
```

### Media tab

```
  Media (3)                                  [ + Attach media ]
  ──────────────────────────────────────────────────────────────────────────
  [thumb] [thumb] [thumb]
  primary  alt 1   alt 2
```

## Annotations

1. **Tabs structure the long-form data.** Overview shows identity + bio + temporal. The other tabs are computed views over junction tables.
2. **Tab counts in the labels** so users can scan participation density without clicking.
3. **Significance is shown in the header**, not in a property block. It's identity-level info.
4. **Temporal scope subsection** computes lifespan when both birth and death are present. For divine/mythological/artifact characters with no death, render "ongoing" or "—" depending on type.
5. **Type-specific fields** (species, breed, domain) render only when applicable, in the Overview tab. The Overview reads adaptively per type — a divine character won't show "lived 66 years" but will show its domain.
6. **Events tab shows referenced birth/death dates as ghost markers** (`↓`) above/below the actual event participations. Helps frame the lifespan visually. These are not clickable; they're context.
7. **Relationships tab groups by `relationship_type` family.** Family, professional, social/personal, antagonistic. The 11 types collapse into ~4 visual groups for the read view.
8. **Danger zone is a disclosure at the bottom**, not a button in the header. Delete shouldn't be one click away.
9. **`[⋯]` button** in the header opens secondary actions: duplicate, export, copy ID, view raw JSON (admin tools).

## Edge cases

- **No biography / no aliases / no media.** Each section renders an inline "Add biography" / "Add aliases" link. No fake empty cards.
- **No events / no relationships.** The corresponding tab shows an empty state with a single CTA.
- **Character has unpublished events but is itself published.** Subtle indicator in the Events tab: "2 events not yet published."
- **Character is referenced by a `subject_character_id` (biographical timeline) or `perspective_character_id` (story).** Surface a "Featured in" subsection in the Overview tab.
- **Permissions: viewing another user's published character.** Same view, but Edit / Publish / Delete actions are hidden. Read-only mode.
- **Loading.** Skeleton header + tab skeletons; main entity loads first, junction tabs lazy-load on activation.

## Open questions

- Should the temporal-scope section include a small inline timeline visualization? Useful for characters with very long lifespans (divine, mythological). Defer to next fidelity — needs design language for the timeline visual first.
- Should we surface "events this character witnessed" (role=witness) separately from "events this character protagonized"? Currently flat list with role label. Could split by role group if users want it.
- "Set primary media" UX — replace the existing primary atomically or require unset first? The schema has no constraint preventing multiple primaries (`is_primary BOOLEAN DEFAULT false`); the editor should enforce single-primary on save.

# 06 — Character Relationships Editor

**Purpose.** Manage a character's edges to other characters. This is the focal screen of the entire admin: temporally-scoped many-to-many with 11 type values and mixed directionality semantics. Three alternatives sketched below.

This file is longer than the others because picking the wrong direction here has the largest blast radius on later design work.

## Data captured

Per `character_relationships`:

- character_id (the focal character — set by context, not user-editable)
- related_character_id (the other party)
- relationship_type (11-enum)
- description
- start_temporal (optional)
- end_temporal (optional)
- metadata (optional, JSONB)

Unique constraint: `(character_id, related_character_id, relationship_type)` — a pair can have multiple types but not duplicate type+direction.

## Directionality semantics

Per system-design §3.3, relationships are stored as **directed pairs** in the database. The application layer is responsible for treating some types as symmetric. The 11 types split:

| Type               | Semantics                                             | Reciprocal?                                                 |
| ------------------ | ----------------------------------------------------- | ----------------------------------------------------------- |
| `family`           | Symmetric (parent/child distinguished by other means) | Often, but role-asymmetric in practice — see Open Questions |
| `friendship`       | Symmetric                                             | Yes — A friend of B ⟺ B friend of A                         |
| `rivalry`          | Symmetric                                             | Yes                                                         |
| `enemy`            | Symmetric                                             | Yes                                                         |
| `collaboration`    | Symmetric                                             | Yes                                                         |
| `professional`     | Symmetric (loosely)                                   | Usually                                                     |
| `owner_pet`        | **Asymmetric**                                        | No — A owns B ≠ B owns A                                    |
| `trainer_trainee`  | **Asymmetric**                                        | No                                                          |
| `creator_creation` | **Asymmetric**                                        | No                                                          |
| `worship`          | **Asymmetric**                                        | No                                                          |
| `mentor_student`   | **Asymmetric**                                        | No                                                          |

This means the editor must distinguish symmetric and asymmetric types and behave differently for each — most critically, asymmetric types must surface direction explicitly in the UI ("Marie _mentors_ Pierre" not "Marie ↔ Pierre").

## Three alternatives

The wireframes below sketch three patterns. The recommendation at the end picks one and explains why; the others remain documented so future iterations can revisit if the first choice fails user testing.

---

## Alternative A — Table-with-modal (densest)

Relationships render as rows in a table on the character detail. Edits open a modal.

### Layout

```
  Relationships — Marie Curie (4)                  [ + Add relationship ]
  ─────────────────────────────────────────────────────────────────────────
  ┌──────────────────┬──────────────────┬─────────────┬──────────────┬───┐
  │ Other character  │ Type             │ Direction   │ Date range   │   │
  ├──────────────────┼──────────────────┼─────────────┼──────────────┼───┤
  │ Pierre Curie     │ family           │ ↔           │ 1895–1906 CE │ ⋯ │
  │ Pierre Curie     │ collaboration    │ ↔           │ 1895–1906 CE │ ⋯ │
  │ Irène Joliot-…   │ family           │ → mother of │ 1897 CE — …  │ ⋯ │
  │ Henri Becquerel  │ professional     │ ↔           │ 1896–1908 CE │ ⋯ │
  └──────────────────┴──────────────────┴─────────────┴──────────────┴───┘

  Pros: dense; sortable; familiar.
  Cons: temporal scope is squashed into one column; direction shown via a glyph
        the user has to learn; edit requires modal.
```

### When to use

- Power users with hundreds of relationships per character (large fictional universe, mythology databases).
- When users prioritize bulk operations.

### Verdict

Rejected as the **default**. The glyph-based direction column doesn't read well, and the modal-per-edit pattern slows the most common interaction. Keep this layout available as a "table view" toggle for power users.

---

## Alternative B — Card stream (recommended default)

Each relationship is a card with full temporal scope visible. Edits happen inline.

### Layout — at rest

```
  Relationships — Marie Curie                       [ + Add relationship ]
  ─────────────────────────────────────────────────────────────────────────
  ▾ Family (2)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Pierre Curie · family                                          [⋯]  │
  │ 1895 CE ────────────────── 1906 CE                                  │
  │ "Married 1895; collaborated on radioactivity research until         │
  │  Pierre's death in 1906."                                           │
  └─────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Irène Joliot-Curie · family                                    [⋯]  │
  │ Marie is mother of Irène                                            │
  │ 1897 CE ─────────────────── ongoing                                 │
  └─────────────────────────────────────────────────────────────────────┘

  ▾ Professional (2)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Pierre Curie · collaboration                                   [⋯]  │
  │ 1895 CE ────────────────── 1906 CE                                  │
  └─────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Henri Becquerel · professional                                 [⋯]  │
  │ 1896 CE ────────────────── 1908 CE                                  │
  └─────────────────────────────────────────────────────────────────────┘
```

### Layout — adding a relationship (right-side sheet)

```
┌───────────────── Add relationship — Marie Curie ─────────────────┐
│                                                                  │
│  Other character *                                               │
│  ⌕ [ Pierre Curie                                          ]    │
│  Pierre Curie · Human · 1859–1906 CE                             │
│                                                                  │
│  Type *                                                          │
│  Family relationships                                            │
│   ( ) family                                                     │
│  Professional                                                    │
│   (●) collaboration       ( ) professional                       │
│  Social / personal                                               │
│   ( ) friendship          ( ) rivalry                            │
│  Antagonistic                                                    │
│   ( ) enemy                                                      │
│  Asymmetric (direction matters)                                  │
│   ( ) Marie mentors Pierre  ( ) Pierre mentors Marie             │
│   ( ) Marie created Pierre  ( ) Pierre created Marie             │
│   ( ) Marie trains Pierre   ( ) Pierre trains Marie              │
│   ( ) Marie owns Pierre     ( ) Pierre owns Marie                │
│   ( ) Marie worships Pierre ( ) Pierre worships Marie            │
│                                                                  │
│  Date range                                                      │
│  Start  [ 1895 CE (exact)  ▾]                                    │
│  End    [ 1906 CE (exact)  ▾]                                    │
│  ─ Leave end empty for ongoing or unknown                        │
│                                                                  │
│  Description (optional)                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Married 1895; collaborated on radioactivity research…      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ☑ Also create the reciprocal edge (Pierre → Marie, same type   │
│    and dates)                                                    │
│    ─ Available only for symmetric types                          │
│                                                                  │
│              [ Cancel ]                          [ Save ]        │
└──────────────────────────────────────────────────────────────────┘
```

### Annotations

1. **Group by relationship-type family** — Family, Professional, Social/personal, Antagonistic, Asymmetric. Each group is collapsible. With ~4 groups the visual density stays scannable even for characters with many relationships.
2. **Card layout reads the temporal range visually.** A horizontal range bar between start and end dates makes "1895–1906 CE" legible at a glance. "Ongoing" renders as an open right edge. For pre-CE dates, the era is in the labels.
3. **Direction is rendered as narrative text on the card.** "Marie is mother of Irène" instead of an arrow. The grammar makes asymmetric types unambiguous.
4. **Add sheet is a right-side slide-out**, not a modal. This makes it easier to reference the current relationships while adding a new one.
5. **Type picker groups by family** (same groups used in the list). Asymmetric types render as paired radios — picking "Marie mentors Pierre" stores `(Marie, Pierre, mentor_student)`; picking "Pierre mentors Marie" stores `(Pierre, Marie, mentor_student)`. The user never sees the column name; they see the semantic relationship.
6. **Reciprocal checkbox** appears only for symmetric types. Default on. On save, two inserts go out: `(Marie, Pierre, family)` and `(Pierre, Marie, family)`.
7. **Type picker uses radio rather than select** because the user benefits from seeing all 11 types at once when choosing — the wrong type is a common error and selects hide that.
8. **Other-character search** is a combobox that excludes the focal character (`Marie`) and any character already linked by the currently-chosen type (to avoid the unique-index violation before save).
9. **The `[⋯]` per card** opens: Edit, Duplicate as different type, Delete.

### Pros

- Temporal scope is visually obvious.
- Direction is unambiguous through narrative text.
- Asymmetric types are handled gracefully.
- Easier to scan than a dense table.
- Reciprocity is opt-out rather than implicit.

### Cons

- Less dense than the table; very prolific characters (50+ relationships) scroll a lot.
- Range-bar visualization requires more design work than a simple date column.

### Verdict

**Recommended default.** It surfaces the hardest concepts (direction, time, type combinations) most clearly, and the cost — vertical density — is acceptable for the target use cases (biographical authoring).

---

## Alternative C — Network graph + slide-out editor

Visualize the character's local relationship graph; click a node or edge to edit.

### Layout

```
  Relationships — Marie Curie                       [ + Add ] [ List view ]
  ─────────────────────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │                                                                     │
  │      ◉ Henri Becquerel                                             │
  │           │                                                         │
  │           │ professional                                            │
  │           │ 1896–1908                                               │
  │           │                                                         │
  │       ╭───┴──╮          family + collab                             │
  │       │Marie │═══════════════════════════════════ ◉ Pierre Curie   │
  │       │Curie │          1895–1906                                   │
  │       ╰──┬───╯                                                      │
  │          │                                                          │
  │          │ family (mother of)                                       │
  │          │ 1897–                                                    │
  │          │                                                          │
  │      ◉ Irène Joliot-Curie                                          │
  │                                                                     │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  Pros: shows the *shape* of relationships at a glance, scales naturally
        to second-degree neighbors, reads as a biographical artifact.
  Cons: requires a visualization library; less efficient for bulk edits;
        edge labels get crowded at 10+ relationships; not a familiar pattern
        for CMS editing.
```

### When to use

- Public reader/explorer view of a character's network (different audience entirely).
- After a graph visualization library is committed elsewhere in the app (e.g., for the cosmic-scale temporal view).
- As a _complement_ to the card stream, not a replacement.

### Verdict

Rejected for **this pass**. The implementation cost is high and the gains are mostly for read-mode browsing, not editing. Revisit after a graph visualization is in the app for other purposes. Until then, the card stream covers the editing need.

---

## Final recommendation

Use **Alternative B (card stream)** as the default and the only implementation in this pass.

- Build the type-grouped card list view.
- Build the right-side sheet for add and edit.
- Surface direction explicitly via narrative text.
- Default reciprocal-edge creation to on for symmetric types.

Defer Alternative A (table view) until a power-user requests it. Defer Alternative C (graph) until a graph visualization exists elsewhere in the app.

## Edge cases (apply to recommended Alternative B)

- **Same pair, multiple types** (e.g., Marie + Pierre as both `family` and `collaboration`). Two cards under different group headers. Both reciprocate independently. Unique index prevents the same type twice.
- **Unique-index violation on save** (race condition where another tab added the same pair-type). DB rejects; toast: "This relationship already exists. View existing?" with link.
- **Self-relationship.** Other-character picker excludes the focal character. DB has `CHECK (character_id != related_character_id)` as backstop.
- **Reciprocal save partial failure.** If the forward edge inserts but the reverse fails (RLS, network), surface "Forward relationship saved, reverse failed. Retry?"
- **Editing reciprocal pairs.** Editing a date on the Marie→Pierre side should optionally propagate to Pierre→Marie. Default: edit _both_ (changes to date range and description sync to the reverse); changing type or removing direction does not propagate. Make the propagation visible via a "synced reciprocal" badge on the card.
- **Deleting reciprocal pairs.** Same default — delete both, with the same "synced reciprocal" affordance and an opt-out.
- **Ongoing relationships.** End date empty renders as "ongoing or unknown." When the focal character has a death date, the editor could prompt: "Marie died in 1934. Set this relationship to end then?" Soft prompt only.
- **Loading.** Skeleton cards in each group; group headers + counts render immediately.

## Open questions

- **Family role granularity.** `family` is one type for parent/child/sibling/spouse/etc. This is a known PRD gap. The card description field carries the nuance ("mother of", "spouse"). Should we add a `relationship_role` column on `character_relationships`? Worth filing as a separate spec issue per CLAUDE.md guidance.
- **Reciprocal sync depth.** Should description text also sync? Today's design: yes, syncs by default; user can decouple via a "decouple reciprocals" affordance. Confirm with users.
- **Cross-relationship dependencies.** "Marie mentors Pierre" + "Pierre is friend of Marie" — independent, no constraint. But "Marie is mother of Irène" + "Irène is mother of Marie" — would be a logical contradiction the system doesn't detect. Acceptable for first pass; not a real risk in practice.
- **Relationship-derived event suggestions.** If Marie and Pierre have a `family` relationship from 1895, the editor could offer "Add 'Marriage' event?" Powerful but speculative — defer until we know if users want it.
- **How does this surface when the related character isn't the user's own?** Today's RLS assumes the user owns both. Collaboration scenarios with shared timelines need separate thinking.

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

This means the editor must distinguish symmetric and asymmetric types and behave differently for each. For asymmetric types the convention is "focal character is the subject of the verb" — the row is always stored from the perspective of whichever character's editor is being used. Cards then surface direction via narrative text ("Marie _mentors_ Pierre" instead of "Marie ↔ Pierre"). Symmetric types create a reciprocal row automatically (paired sub-roles get the inverted role; symmetric sub-roles and symmetric flat types keep the same role).

## Sub-role taxonomy (Batch 2 decision)

Per [#119](https://github.com/shaes-farm/time-traveler/issues/119), three of the eleven types accept an optional `relationship_role` sub-role; the other eight must have NULL role. Sub-roles refine direction within a type.

- **family** — `spouse` (sym), `parent`/`child` (paired), `sibling` (sym), `grandparent`/`grandchild` (paired), `aunt_uncle`/`niece_nephew` (paired), `cousin` (sym), `in_law` (loosely paired), `step_parent`/`step_child` (paired), `step_sibling` (sym), `adoptive_parent`/`adoptive_child` (paired), `other`
- **professional** — `employer`/`employee` (paired), `colleague` (sym), `supervisor`/`subordinate` (paired), `business_partner` (sym), `client`/`vendor` (paired), `other`
- **collaboration** — `co_author`, `co_founder`, `research_partner`, `performance_partner`, `band_member`, `creative_partner` (all symmetric), `other`
- **Other 8 types** (`friendship`, `rivalry`, `enemy`, `mentor_student`, `owner_pet`, `trainer_trainee`, `creator_creation`, `worship`) — `relationship_role` is NULL.

For **paired sub-roles**, the admin auto-creates the reverse edge with the inverted role: picking "Marie parent of Pierre" stores `(Marie, Pierre, family, parent)` and `(Pierre, Marie, family, child)`. For **symmetric sub-roles** (and the symmetric flat types like `friendship`), both rows are stored with the same type+role. Reciprocal-edge creation is now **implicit** in the type/role choice — there is no longer a "reciprocal" checkbox in the editor.

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
│   ( ) professional                                               │
│   (●) collaboration                                              │
│      Role *  (●) co_author      ( ) co_founder                   │
│              ( ) research_partner  ( ) performance_partner       │
│              ( ) band_member    ( ) creative_partner             │
│              ( ) other                                           │
│      Symmetric — reciprocal pair created automatically with      │
│      the same role.                                              │
│  Social / personal                                               │
│   ( ) friendship          ( ) rivalry                            │
│  Antagonistic                                                    │
│   ( ) enemy                                                      │
│  Asymmetric (focal character is subject of the verb)             │
│   ( ) mentor / student                                           │
│   ( ) creator / creation                                         │
│   ( ) trainer / trainee                                          │
│   ( ) owner / pet                                                │
│   ( ) worship                                                    │
│                                                                  │
│  Date range                                                      │
│  Start  [ 1895 CE (exact)  ▾]                                    │
│  End    [ 1906 CE (exact)  ▾]                                    │
│  ─ Leave end empty for ongoing or unknown                        │
│                                                                  │
│  Description from Marie's perspective (optional)                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Co-authored discovery of radioactivity with Pierre…        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Reciprocal edge will be created with description blank. Add     │
│  Pierre's perspective from his character page if desired.        │
│                                                                  │
│              [ Cancel ]                          [ Save ]        │
└──────────────────────────────────────────────────────────────────┘
```

### Layout — sub-role chooser (paired vs. symmetric)

The role chooser renders **differently per sub-role kind** so the directional meaning is unmistakable at pick time. Within `family` (and identically `professional`), roles are grouped under a small `Role *` header; **paired** roles render as a single directional control naming both ends, **symmetric** roles render as a plain radio.

```
  Type *  (●) family
  ───────────────────────────────────────────────────────────────
  Role *
   Paired (direction matters — reciprocal gets the inverse)
    (●) Marie is the  [ parent ▾ ]  of the other character
         ⇄ stores (Marie, X, family, parent) + (X, Marie, family, child)
    ( ) Marie is the  [ grandparent ▾ ]  of …
    ( ) Marie is the  [ aunt/uncle ▾ ]  of …
    ( ) Marie is the  [ step-parent ▾ ]  of …
    ( ) Marie is the  [ adoptive parent ▾ ]  of …
    ( ) Marie is the  [ in-law ▾ ]  of …  (loosely paired)
   Symmetric (same role both directions)
    ( ) spouse     ( ) sibling     ( ) cousin     ( ) step-sibling
    ( ) other
```

- The **paired control's dropdown flips the stored role** for whichever end the author names (`parent` ⇄ `child`), so the author never has to reason about the reverse row — picking "Marie is the **parent**" auto-stores the reciprocal as `child`. The inline `⇄ stores …` hint makes the pair explicit (annotation #6).
- **Symmetric roles are a flat radio row** — no direction control, because both rows carry the same role.
- `collaboration` is **all-symmetric**, so it shows only the flat radio row (the example in the main add-sheet above). `professional` mixes both (paired `employer`/`employee`, `supervisor`/`subordinate`, `client`/`vendor`; symmetric `colleague`, `business_partner`).
- The **other 8 types show no `Role *` block at all** (`relationship_role` is NULL) — selecting `friendship`, `enemy`, `mentor_student`, etc. collapses the role area entirely so there is never an empty/disabled role control to puzzle over.

### Annotations

1. **Group by relationship-type family** — Family, Professional, Social/personal, Antagonistic, Asymmetric. Each group is collapsible. With ~4 groups the visual density stays scannable even for characters with many relationships.
2. **Card layout reads the temporal range visually.** A horizontal range bar between start and end dates makes "1895–1906 CE" legible at a glance. "Ongoing" renders as an open right edge. For pre-CE dates, the era is in the labels.
3. **Direction is rendered as narrative text on the card.** "Marie is mother of Irène" instead of an arrow. The grammar makes asymmetric types unambiguous.
4. **Add sheet is a right-side slide-out**, not a modal. This makes it easier to reference the current relationships while adding a new one.
5. **Type picker groups by family** (same groups used in the list). For `family`, `professional`, and `collaboration`, picking a type reveals an inline sub-role chooser ([#119](https://github.com/shaes-farm/time-traveler/issues/119); Batch 2 decision Q3) under a `Role *` header — see [Layout — sub-role chooser](#layout--sub-role-chooser-paired-vs-symmetric). Within that chooser, **paired** roles render as one directional control that names both ends (and auto-stores the inverse on the reciprocal row), while **symmetric** roles render as a flat radio row. The **other 8 types render no role block at all** (NULL `relationship_role`) — the role area collapses so there is never an empty/disabled control. Asymmetric types still render as a single radio per type. The implementation convention is **focal character is the subject of the verb** — picking `mentor_student` from Marie's editor stores `(Marie, Pierre, mentor_student)` ("Marie mentors Pierre"). To record the reverse direction ("Pierre mentored Marie"), the author switches to Pierre's editor and creates the relationship from there; direction lives implicitly in column ordering. An earlier iteration of this wireframe specified paired radios per asymmetric type with name interpolation; that approach was implemented (PR #164) and reverted because the 10 paired rows added visual weight disproportionate to their value — narrative direction is already carried by the description field, and the focal-is-subject convention covers the common case.
6. **Reciprocal-edge creation is implicit** in the type/role choice — there is no longer a "reciprocal" checkbox (Batch 2 decision Q1). For paired sub-roles (`parent`/`child`, `grandparent`/`grandchild`, `employer`/`employee`, etc.) the system stores both rows with inverted roles. For symmetric sub-roles and symmetric flat types (`friendship`, `rivalry`, `enemy`, `collaboration` with a symmetric role), both rows are stored with the same type+role. **Description does not sync** between the two rows — each character's card carries its own perspective text. Dates and type/role sync between paired rows; future edits to dates propagate, edits to description do not.
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
- **Editing reciprocal pairs.** Date and type changes sync between the two rows (Batch 2 Q1). Description does **not** sync — each card edits its own description independently. Sub-role changes sync only when the role pairing is preserved (e.g., changing `parent` → `adoptive_parent` propagates the new pairing `child` → `adoptive_child` to the reverse row). Make the date/type sync visible via a "synced reciprocal" badge on the card.
- **Deleting reciprocal pairs.** Delete both rows by default. The "synced reciprocal" affordance has a "delete only this side" opt-out for users who want to keep the reverse-direction record (rare; mostly useful when one side of an asymmetric paired role is being intentionally orphaned).
- **Logical contradictions** (Batch 2 Q2). When saving, the system checks for existing relationships that would contradict the new one — most commonly mutual paired sub-roles like `parent` in both directions (Marie parent of Irène + Irène parent of Marie). Surface a soft warning: "This appears contradictory with Irène's existing `parent` relationship to Marie. Continue?" — but never block the save. Author can override; the system trusts them.
- **Ongoing relationships.** End date empty renders as "ongoing or unknown." When the focal character has a death date, the editor could prompt: "Marie died in 1934. Set this relationship to end then?" Soft prompt only.
- **Loading.** Skeleton cards in each group; group headers + counts render immediately.

## Open questions

- **Relationship-derived event suggestions.** If Marie and Pierre have a `family/spouse` relationship from 1895, the editor could offer "Add 'Marriage' event?" Powerful but speculative — defer until we know if users want it. (Tier 4 — defer until implementation surfaces real demand.)
- **Cross-user collaboration scenarios.** Today's RLS assumes the user owns both characters in the relationship. Collaboration scenarios with shared timelines need separate thinking. (Tier 4 — defer.)

> **Resolved (Batch 2):**
>
> - Sub-role taxonomy ([#119](https://github.com/shaes-farm/time-traveler/issues/119)) — Option A. See the [Sub-role taxonomy](#sub-role-taxonomy-batch-2-decision) section above.
> - Reciprocal sync depth — dates and type/role sync; description stays per-side. See edge cases and annotation #6.
> - Logical contradiction detection — warn but never block. See edge cases.

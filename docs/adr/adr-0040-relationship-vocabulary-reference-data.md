---
title: "ADR-0040: Relationship vocabulary as reference data"
status: "Accepted"
date: "2026-08-03"
authors: "Time Traveler engineering"
tags:
  [
    "architecture",
    "decision",
    "data-model",
    "relationships",
    "schema",
    "reference-data",
  ]
supersedes: ""
superseded_by: ""
amends: "ADR-0008 (character relationships as directed pairs); ADR-0009 (relationship_role sub-role taxonomy)"
amended_by: "ADR-0041 (admin CRUD surface; key rename withheld from the UI)"
---

# ADR-0040: Relationship vocabulary as reference data

## Status

**Accepted**

Amends [ADR-0008](adr-0008-character-relationships-directed-pairs.md) (directed-pair
relationship model) and [ADR-0009](adr-0009-relationship-sub-role-taxonomy.md)
(`relationship_role` sub-roles). Both remain in force. What changes is the **enforcement
mechanism**, not the directed-pair model or the content of the role taxonomy: three `CHECK`
constraints become two foreign keys into reference tables.

## Context

`relationship_type` was a controlled vocabulary of 11 interpersonal values fixed by an inline
`CHECK` on `character_relationships` (`00002_relationships_junctions.sql`), and
`relationship_role` was constrained by two further type-conditional `CHECK`s
(`00014_relationship_role.sql`).

Modelling any corpus beyond interpersonal ties — causal and derivational relations among
people, instruments, standards bodies and ideas — requires verbs the enum does not contain
(`superseded`, `derived_from`, `patented`, `standardized`, …). The obvious fix was to widen the
`IN`-list. That was implemented and then rejected, for two reasons.

### The vocabulary was defined in five places

Adding a value required editing all five in lockstep:

| Definition             | Location                                                          |
| ---------------------- | ----------------------------------------------------------------- |
| DB `CHECK`             | `supabase/migrations/00002_relationships_junctions.sql`           |
| `relationshipTypeEnum` | `packages/services/src/schemas/character-relationship.ts`         |
| `TYPE_FAMILIES`        | `packages/ui/src/components/relationship-type-selector.tsx`       |
| `ASYMMETRIC_TYPES`     | `packages/services/src/modules/character-relationship-service.ts` |
| verb/noun maps         | `apps/admin/…/character-detail-helpers.ts`                        |

### The lockstep failed on the very first widening

Widening the `CHECK` from 11 to 32 values updated the first two and missed the rest, shipping
three defects:

1. **Bogus reciprocal rows.** `ASYMMETRIC_TYPES` still listed only the original five directed
   types, so all 21 new verbs were treated as symmetric. Creating "quartz `superseded`
   pendulum" auto-inserted "pendulum `superseded` quartz" — a factually inverted claim.
2. **The new types were unreachable from the UI**, because the selector rendered a hard-coded
   list of 11 radios.
3. **They rendered wrong** — grouping fell back to "Social / Personal" for anything
   unrecognised, and the direction line degraded to a bare `"Harrison — chronometer"`.

Fixing those three instances would leave the class of defect intact. Relationship vocabulary
grows continuously as the corpus and its character types expand, so DDL-gated growth does not
scale.

## Decision

**Model the vocabulary as reference data behind foreign keys.** Adding a relationship type is
an `INSERT`, not a migration.

Three tables with natural text primary keys — the keys _are_ the strings already stored in
`character_relationships`:

```
relationship_categories   selector grouping; orders the GROUPS
  └─ relationship_types   the vocabulary; orders types WITHIN a group
       └─ relationship_roles   the ADR-0009 sub-role taxonomy
```

`relationship_types` carries the metadata that was previously hard-coded in application code:
`is_symmetric` and `inverse_key` (was `ASYMMETRIC_TYPES`), `direction_verb` and
`symmetric_noun` (was the detail-helper maps), `category_key` and `sort_order` (was
`TYPE_FAMILIES`). `relationship_roles.inverse_key` replaces `ROLE_INVERSE`.

### Three CHECKs collapse into two FKs

| Was                                                         | Now                                    |
| ----------------------------------------------------------- | -------------------------------------- |
| `character_relationships_relationship_type_check` (`00002`) | FK → `relationship_types(key)`         |
| `relationship_role_valid` (`00014`)                         | composite FK, non-NULL branch          |
| `relationship_role_null_for_other_types` (`00014`)          | composite FK, `MATCH SIMPLE` NULL-skip |

The composite FK `(relationship_type, relationship_role) → relationship_roles(type_key, key)`
is the load-bearing piece. Under the default `MATCH SIMPLE` a composite FK is **not checked
when any referencing column is NULL**, which is exactly the "a role may always be NULL"
semantics the dropped `CHECK` encoded — with no trigger. A non-NULL role is validated against
the pair, which is what the other `CHECK` encoded. This follows the pattern already established
by `00027_categories_same_owner_parent.sql` and `00028_periods_same_owner_parent.sql`.

"Which types accept a sub-role" becomes derived data: a type accepts one iff it has
`relationship_roles` rows. A future sub-roled type therefore needs no DDL.

### Reciprocal semantics become three-way

`computeReciprocalRow` reads the vocabulary instead of a hard-coded set:

- `is_symmetric` → the reciprocal row carries the **same** type;
- `inverse_key` set → the reciprocal carries **that** type;
- neither → **no** reciprocal row; a single directed assertion.

A type unknown to the client yields no reciprocal. That is deliberately the safe default, and
it is the direct fix for defect 1 above.

This also **closes the long-standing `is_bidirectional` question from issue #32**: symmetry is
per-type vocabulary metadata, not a per-row column.

### The application layer stops enumerating values

`relationship_type` is validated as a _shape_ — `z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/)`
— matching how every other FK-referenced field in `@repo/services` is handled (`category.ts`,
`event.ts`, `timeline.ts` all validate `z.string().uuid()` and let the FK decide existence).
Callers holding the fetched vocabulary can opt into value-level checking via
`makeCharacterRelationshipSchema(vocabulary)` for pre-flight editor errors; that check is
**advisory**, because a client whose cache predates a newly added type must never block a write
the database would accept.

### Artifact separation

The vocabulary is a **codebook** — the value domain of a categorical variable — with a
lifecycle distinct from both the schema that constrains it and the corpora that reference it.
Three artifact classes, not two:

| Class          | Artifact                                 | Contents                               |
| -------------- | ---------------------------------------- | -------------------------------------- |
| Schema         | `00029_relationship_vocabulary.sql`      | Tables, FKs, RLS, GRANTs — **no rows** |
| Reference data | `00030_seed_relationship_vocabulary.sql` | The foundational ontology, idempotent  |
| Instance data  | Seed scripts                             | Corpora — relationship rows only       |

A codebook belongs in versioned migration history and **never in a seed script**, because seed
scripts are run locally and never reach staging or production; vocabulary owned by one would
leave those environments with an empty domain and a non-functional relationships feature.

The seeded set is a **foundational ontology**: the ways any of the seven character types may
relate to any other, defined a priori and extended through the admin UI. It deliberately
includes levels with zero observations — a codebook that enumerates only what a corpus happens
to use cannot express "no `mentor_student` relationships were recorded" as distinct from
"`mentor_student` is not a thing."

`00030` is a one-time bootstrap, not a sync point: its `ON CONFLICT DO NOTHING` guards mean
re-running never clobbers vocabulary an admin has since curated.

## Consequences

### Positive

- **POS-001**: One source of truth. Symmetry, inverse, labels, grouping, ordering and display
  verbs live in one row each, so the UI and the service cannot drift apart again.
- **POS-002**: Adding a relationship type is a data operation. No migration, no deploy, no
  lockstep edit across five files.
- **POS-003**: Fixes the bogus-reciprocal defect at its root rather than by extending a list.
- **POS-004**: `is_active` retires a verb without touching historical rows; FK `RESTRICT` turns
  "delete a type still in use" into a caught error instead of orphaned strings.
- **POS-005**: Zero data migration. The keys are the strings already stored, so
  `character_network_view` (`00006`/`00014`), `get_character_network()` (`00008`) and PostgREST
  filters such as `?relationship_type=eq.family` are untouched — and gain
  `select=*,relationship_types(*)` embeds.

### Negative

- **NEG-001**: `relationship_type` is no longer a closed TypeScript union. Static exhaustiveness
  is traded for runtime validation against fetched vocabulary. The union was arguably a fiction
  once the set became extensible — it asserted knowledge the code did not have.
- **NEG-002**: The relationships editor has a data dependency before it can render a type
  picker, so it needs loading, error **and empty** states. Empty is reachable: a database that
  has not run `00030` legitimately has no vocabulary.
- **NEG-003**: `createRelationship`, `updateRelationship` and `deleteRelationship` each read the
  vocabulary, adding one query per write. Chosen over caching for always-current correctness.
- **NEG-004**: `00029` and `00030` are not independently deployable. Between them
  `relationship_types` is empty and no relationship can be created, so they must land together.
- **NEG-005**: pgTAP suites that create relationships must now seed the vocabulary they use
  (`00002`, `00006`, `00007`, `00008`, `00014`), since `00029` seeds nothing.
- **NEG-006**: Directionality remains implicit in column order
  (`character_id → related_character_id`), inherited from ADR-0008. `inverse_key` documents
  intent but no DB guard forces correct authoring order for asymmetric verbs.
- **NEG-007**: ~~Until admin CRUD ships (#428), "managed through the admin UI" is true only via
  SQL.~~ **Resolved** by #428: the vocabulary manager ships at
  `/admin/relationship-vocabulary`. One narrowing survives — renaming a `key` is deliberately
  withheld from the UI and remains a SQL operation, per
  [ADR-0041](adr-0041-admin-only-surfaces-and-immutable-vocabulary-keys.md).

## Alternatives Considered

### Widen the `CHECK` list

- **ALT-001**: **Description**: Keep the `CHECK`-as-enum and extend the `IN`-list from 11 to 32
  values, mirroring it in the Zod enum. This was implemented before being rejected.
- **ALT-002**: **Rejection Reason**: Every future verb costs a migration plus lockstep edits in
  four application-layer copies — and the branch's own three defects demonstrate that lockstep
  failing on the first attempt. It relocates the scalability problem rather than solving it.

### Postgres `ENUM` type

- **ALT-003**: **Description**: Replace the `CHECK` with a native `ENUM`.
- **ALT-004**: **Rejection Reason**: `ALTER TYPE … ADD VALUE` is still DDL, so growth stays
  migration-gated, and an `ENUM` carries no metadata — symmetry, inverse, labels and display
  verbs would remain hard-coded in application code.

### Lookup table with a surrogate UUID primary key

- **ALT-005**: **Description**: The same reference tables, but keyed by UUID with
  `relationship_type` becoming a UUID FK.
- **ALT-006**: **Rejection Reason**: Forces an `UPDATE` of every existing relationship row, and
  changes the column type exposed by `character_network_view` — which `CREATE OR REPLACE VIEW`
  cannot do, requiring `DROP … CASCADE`. It also breaks readable PostgREST filters and the
  inline string keys in seed scripts, for no benefit: the slug is already stable and unique.

### Keep the vocabulary out of migrations entirely

- **ALT-007**: **Description**: Ship only the tables and let each dataset insert the verbs it
  needs.
- **ALT-008**: **Rejection Reason**: Seed scripts are local-only, so staging and production
  would hold an empty domain and a non-functional relationships feature. It also makes level
  membership a function of corpus coverage, destroying the distinction between structural and
  sampling zeros, and couples shared reference data to a corpus's delete-and-recreate teardown.

### Encode causality in `description`/`metadata`

- **ALT-009**: **Description**: Use the closest existing type and store the precise verb as free
  text.
- **ALT-010**: **Rejection Reason**: Causal links would not be queryable as typed edges,
  defeating the purpose of a navigable relationship graph.

## Implementation Notes

- **IMP-001**: `supabase/migrations/00029_relationship_vocabulary.sql` (DDL, no rows) and
  `00030_seed_relationship_vocabulary.sql` (the ontology). pgTAP in
  `00029_relationship_vocabulary_test.sql` and `00030_seed_relationship_vocabulary_test.sql`.
- **IMP-002**: `packages/services/src/schemas/relationship-vocabulary.ts` defines the row shapes
  and the `RelationshipVocabulary` lookup; `modules/relationship-type-service.ts` fetches the
  ordered tree in one embedded read.
- **IMP-003**: `packages/ui/src/hooks/use-relationship-types.tsx` caches it. **Admin mutations
  must invalidate `relationshipTypeKeys`**, or an admin adds a type and cannot select it until a
  reload — reproducing at runtime the staleness this ADR removes.
- **IMP-004**: `23503` is mapped in both write paths, branching on constraint name to
  distinguish an unknown type from an invalid (type, role) pair.
- **IMP-005**: ~~Admin CRUD for the three tables is tracked in #428.~~ **Shipped** in #428.
  Every mutation hook in `use-relationship-types.tsx` invalidates
  `relationshipTypeKeys.all` (satisfying IMP-003), and
  `e2e/admin-authenticated/relationship-vocabulary-crud.spec.ts` asserts the consequence
  end-to-end: a type added in the manager is selectable in the relationship editor after a
  client-side navigation, with no reload. See
  [ADR-0041](adr-0041-admin-only-surfaces-and-immutable-vocabulary-keys.md) for the access model.

## References

- **REF-001**: [ADR-0008](adr-0008-character-relationships-directed-pairs.md),
  [ADR-0009](adr-0009-relationship-sub-role-taxonomy.md),
  [ADR-0034](adr-0034-api-role-table-grants.md) (GRANT convention).
- **REF-002**: `supabase/migrations/00002_relationships_junctions.sql`,
  `00014_relationship_role.sql`, `00027_categories_same_owner_parent.sql`,
  `00028_periods_same_owner_parent.sql` (composite-FK precedent).
- **REF-003**: Issue #419 (this refactor), #428 (admin CRUD), #32 (the earlier vocabulary
  proposal and the `is_bidirectional` question, both reconciled here).

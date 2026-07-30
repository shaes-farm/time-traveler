---
title: "ADR-0040: Extend character_relationship vocabulary with causal/derivational types"
status: "Accepted"
date: "2026-07-16"
authors: "Time Traveler engineering"
tags: ["architecture", "decision", "data-model", "relationships"]
supersedes: ""
superseded_by: ""
amends: "ADR-0008 (character relationships as directed pairs)"
amended_by: ""
---

# ADR-0040: Extend character_relationship vocabulary with causal/derivational types

## Status

**Accepted**

Amends [ADR-0008](adr-0008-character-relationships-directed-pairs.md) (directed-pair
relationship model) and [ADR-0009](adr-0009-relationship-sub-role-taxonomy.md)
(`relationship_role` sub-roles). Both remain in force; this record only widens the
`relationship_type` controlled vocabulary.

## Context

The relationship model established in ADR-0008 fixed a controlled vocabulary of 11
**interpersonal/social** `relationship_type` values (`family`, `professional`,
`friendship`, `rivalry`, `owner_pet`, `trainer_trainee`, `creator_creation`, `worship`,
`collaboration`, `enemy`, `mentor_student`) — enforced by a `CHECK` on
`character_relationships.relationship_type`
(`00002_relationships_junctions.sql`) and mirrored by `relationshipTypeEnum` in
`packages/services/src/schemas/character-relationship.ts`.

The first production-quality dataset, **"The Human Discovery of Time"**
([docs/the-human-discovery-of-time.md](../the-human-discovery-of-time.md)), needs to model
**causal and derivational** ties among people, instruments (modeled as `artifact`
characters), standards bodies (`organization` characters), and ideas: one clock
`superseded` another; an inventor `patented` / `improved` / `named` an artifact; a body
`standardized` / `adopted` a unit; a theory `challenged` / `contradicted` an earlier one; a
successor `succeeded` a predecessor. Recording these as first-class relationship rows —
rather than free-text `description` notes — keeps the causal graph **queryable** through
`character_network_view` and the relationships editor, which is a core reason the corpus
was chosen as the platform's "Rosetta Stone."

The dataset author's list contains 21 verbs:
`observed, influenced, improved, standardized, enabled, superseded, derived_from,
challenged, inspired, succeeded, contradicted, copied, predicted, calculated, measured,
named, patented, adopted, rejected, forgotten, rediscovered`.

Two scoping facts shape the decision:

1. **`character_relationships` links character↔character only.** Verbs whose object is an
   _event_ (an observation or concept event — `observed`, `predicted`, `measured`,
   `calculated`, and event-state verbs `rediscovered`/`forgotten`/`rejected`) are modeled
   via `event_characters` participation (the `role` enum already includes `observer`; the
   precise verb is stored in `event_characters.description`). Those verbs are **also** added
   to the relationship vocabulary because they can legitimately describe one character's
   stance toward another character's work.
2. Issue #32 proposed an earlier, different 16-type list that was never implemented; the DB
   `CHECK` has always been the source of truth (ADR-0008). This ADR reconciles that
   divergence by making the DB `CHECK` + Zod enum the single 32-value vocabulary and
   closing the stale `DECISION NEEDED` note in `character-relationship.ts`.

## Decision

Widen the controlled vocabulary to **32 values**: the original 11 plus the 21 causal /
derivational / attitudinal verbs above (normalized to snake_case: `derived_from`).

Implementation keeps the existing pattern rather than introducing new machinery:

- A new numbered migration (`00029_extend_relationship_types.sql`) `DROP`s and re-`ADD`s the
  inline `CHECK` constraint `character_relationships_relationship_type_check` with the full
  32-value `IN`-list. Widening an `IN`-list `CHECK` invalidates no existing rows, so no data
  migration is required.
- The two `relationship_role` `CHECK`s from ADR-0009 are left untouched: sub-roles are
  enumerated only for `family`/`professional`/`collaboration`, and
  `relationship_role_null_for_other_types` already forces `relationship_role IS NULL` for
  every other type, so the 21 new types fall through to the NULL branch automatically.
  `typeAcceptsRole` stays `{family, professional, collaboration}`.
- `relationshipTypeEnum` (Zod) is extended to the identical 32-value set.

## Consequences

### Positive

- **POS-001**: Causal/derivational history (supersession chains, patents, standardization,
  intellectual influence) becomes first-class, queryable relationship data instead of
  free-text — directly exercising and demonstrating the relationship subsystem.
- **POS-002**: No new tables, columns, RLS policies, or GRANTs; the change rides entirely on
  the existing `CHECK` + Zod pattern, so it is low-risk and backward-compatible.
- **POS-003**: Reconciles the long-standing issue #32 vocabulary divergence and removes a
  `DECISION NEEDED` marker from the codebase.

### Negative

- **NEG-001**: The `CHECK`-as-enum now carries 32 values; each future vocabulary change is
  another `DROP`/`ADD CONSTRAINT` migration and a Zod edit that must stay in lockstep.
- **NEG-002**: Directionality remains implicit in column order
  (`character_id → related_character_id`), inherited from ADR-0008. For asymmetric causal
  verbs (`superseded`, `derived_from`, `succeeded`) authors must populate the pair in the
  correct order; there is no DB-level guard against reversal.
- **NEG-003**: Two homes now exist for "observation-like" verbs (relationship row vs.
  `event_characters` participation), which authors must choose between per the object type
  (character vs. event).

## Alternatives Considered

### Normalize to a `relationship_types` lookup table

- **ALT-001**: **Description**: Replace the `CHECK`-as-enum with a `relationship_types`
  reference table + FK, so new verbs are `INSERT`s (data) rather than migrations (DDL).
- **ALT-002**: **Rejection Reason**: A larger, cross-cutting change to the model ADR-0008
  fixed; not justified by a single dataset. Recorded here as the recommended path **if** the
  vocabulary keeps growing — revisit when the `CHECK` list becomes unwieldy.

### Keep the 11-type vocabulary; encode causality in metadata

- **ALT-003**: **Description**: Use the closest existing types and store the precise causal
  verb in `description`/`metadata`.
- **ALT-004**: **Rejection Reason**: Causal links would not be queryable as typed edges,
  defeating the dataset's purpose of demonstrating a rich, navigable relationship graph.

## Implementation Notes

- **IMP-001**: Migration `00029_extend_relationship_types.sql`; Zod
  `relationshipTypeEnum`; pgTAP additions in
  `00002_relationships_junctions_test.sql` and `00014_relationship_role_test.sql`
  (accepts a new type, and enforces NULL role for new types).
- **IMP-002**: Generated types (`packages/services/src/supabase/types.ts`) are unaffected —
  `relationship_type` is typed `string` at the DB layer.
- **IMP-003**: First consumer is `scripts/seed-human-discovery-of-time.mts`
  (see [docs/seeding-human-discovery-of-time.md](../seeding-human-discovery-of-time.md)).

## References

- **REF-001**: [ADR-0008](adr-0008-character-relationships-directed-pairs.md),
  [ADR-0009](adr-0009-relationship-sub-role-taxonomy.md).
- **REF-002**: [docs/the-human-discovery-of-time.md](../the-human-discovery-of-time.md);
  `supabase/migrations/00002_relationships_junctions.sql`,
  `00014_relationship_role.sql`, `00029_extend_relationship_types.sql`.
- **REF-003**: Issue #32 (earlier 16-type proposal, reconciled here).

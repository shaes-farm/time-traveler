---
title: "ADR-0008: Character Relationships as Directed Pairs with Application-Layer Symmetry"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "relationships"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: "ADR-0009 (relationship_role sub-roles, #119); ADR-0040 (causal/derivational vocabulary)"
---

# ADR-0008: Character Relationships as Directed Pairs with Application-Layer Symmetry

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00002_relationships_junctions.sql` (2026-05-21); specified
in `docs/system-design.md` §3.3. **Amended by ADR-0009**, which adds the
`relationship_role` sub-role taxonomy.

## Context

Characters relate to one another (family, professional, rivalry, mentorship,
ownership, worship, …), and those relationships are temporally scoped (they have
start/end dates) and can be of multiple types between the same pair. The model
needs to support both inherently directional relationships (mentor→student,
owner→pet) and symmetric ones (friendship), without duplicating every symmetric
edge.

## Decision

Store relationships in a dedicated `character_relationships` table as **directed
pairs**: `(character_id, related_character_id, relationship_type)` with its own
`user_id` (unlike the junction tables — see ADR-0010), temporal scope
(`start_temporal`/`end_temporal` JSONB), and `description`/`metadata`.
Constraints:

- `CHECK (character_id != related_character_id)` — no self-relationships.
- `UNIQUE (character_id, related_character_id, relationship_type)` — prevents
  duplicate edges while allowing the same pair to carry multiple types.

**Symmetry is an application-layer concern**: bidirectional relationships
(friendship) are not double-stored; the service/UI queries in both directions
(`character_id = X OR related_character_id = X`). Because the table owns a
`user_id`, RLS is simple ownership (ADR-0014), rather than the more expensive
"visible if either character is visible" interpretation, which was explicitly
rejected (`docs/system-design.md` §9.2.5).

## Consequences

### Positive

- **POS-001**: A single row per relationship edge — no symmetric duplication to
  keep in sync.
- **POS-002**: Directional relationships are natural (the pair order encodes
  direction); the unique index still allows multiple distinct types per pair.
- **POS-003**: The owning `user_id` gives deterministic, cheap ownership-based RLS
  without recursive evaluation through the characters policy.
- **POS-004**: Temporal scoping reuses ADR-0005, so a mentorship that ran
  1200–1210 CE or a species-rivalry at MYA scale are both expressible.

### Negative

- **NEG-001**: Symmetry correctness lives in application code — every query that
  wants "all relationships of X" must remember to check both columns.
- **NEG-002**: The `relationship_type` enum collapses semantically distinct
  sub-roles (family = spouse/parent/child/…) into one value — the gap addressed
  by ADR-0009.
- **NEG-003**: `character_id`/`related_character_id` traversal direction in
  network queries needed later clarification (flagged
  `// DECISION NEEDED` in the service layer).

## Alternatives Considered

### Double-stored symmetric edges

- **ALT-001**: **Description**: Insert both `(A,B)` and `(B,A)` for symmetric
  relationships.
- **ALT-002**: **Rejection Reason**: Doubles storage and creates a consistency
  burden (update/delete both rows); a single row + bidirectional query is
  cheaper.

### "Visible if either character is visible" RLS

- **ALT-003**: **Description**: A relationship is readable if either endpoint
  character is readable.
- **ALT-004**: **Rejection Reason**: Requires recursive RLS evaluation through the
  characters policy; rejected in favor of the deterministic `user_id` ownership
  check (§9.2.5).

## Implementation Notes

- **IMP-001**: Table, `CHECK`, and `char_rels_unique` index in `00002`; indexes
  `idx_char_rels_char` / `idx_char_rels_related` support both traversal
  directions (`docs/system-design.md` §8.1).
- **IMP-002**: `character_network(p_character_id, p_depth)` recursive read
  function consumes these edges (ADR-0013).
- **IMP-003**: The unique index is later **extended** to include
  `relationship_role` (ADR-0009, migration `00014`).

## References

- **REF-001**: ADR-0009 (sub-role taxonomy — amends this ADR), ADR-0010
  (why this table _does_ carry `user_id`), ADR-0013 (`character_network`),
  ADR-0014 (ownership RLS)
- **REF-002**: `supabase/migrations/00002_relationships_junctions.sql`;
  `docs/system-design.md` §3.3, §9.2.5
- **REF-003**: PRD §3 (relationships)

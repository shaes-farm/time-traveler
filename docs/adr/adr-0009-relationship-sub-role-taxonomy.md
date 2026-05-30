---
title: "ADR-0009: Relationship Sub-Role Taxonomy (relationship_role)"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-24"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "relationships"]
supersedes: ""
superseded_by: ""
amends: "ADR-0008 (character relationships directed pairs, #119)"
amended_by: ""
---

# ADR-0009: Relationship Sub-Role Taxonomy (relationship_role)

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00014_relationship_role.sql` (2026-05-24, issue #119).
This ADR **amends** ADR-0008.

## Context

ADR-0008's `relationship_type` enum collapses semantically distinct sub-roles
into one value for three types: `family` (spouse / parent / child / sibling / …),
`professional` (employer / employee / colleague / …), and `collaboration`
(co_author / co_founder / research_partner / …). The other eight types are
already specific or encode direction by type pairing
(`00014_relationship_role.sql` header). Users need to record the specific role
without an explosion of top-level enum values, and the model must remain
backwards-compatible with rows that predate the distinction.

## Decision

Adopt **Option A from #119**: add a single **nullable `relationship_role`**
column to `character_relationships`, governed by **type-conditional CHECK
constraints** (the allowed `relationship_role` values depend on
`relationship_type`; for the eight already-specific types the role is null).
Extend the uniqueness key to include the new column using
`UNIQUE NULLS NOT DISTINCT (character_id, related_character_id, relationship_type,
relationship_role)`, so that rare-but-real cases (e.g., adoptive **and**
biological parent of the same child) coexist as separate rows, while two
`NULL`-role rows of the same type still collide as duplicates.

## Consequences

### Positive

- **POS-001**: Captures sub-role precision (spouse vs. sibling) without inflating
  the top-level `relationship_type` enum.
- **POS-002**: Backwards-compatible — existing rows get `relationship_role = NULL`
  automatically; no data migration needed.
- **POS-003**: `NULLS NOT DISTINCT` keeps the uniqueness guarantee intact for the
  null-role case while permitting multiple distinct sub-roles per pair/type.
- **POS-004**: Type-conditional CHECK keeps role values valid for their type at
  the database level.

### Negative

- **NEG-001**: The type→allowed-role mapping is encoded in CHECK constraints,
  which must be kept in sync with the application's role lists and the relationship
  editor UI.
- **NEG-002**: `NULLS NOT DISTINCT` is a relatively recent Postgres feature; the
  uniqueness semantics are subtler than a plain unique index and need to be
  understood when extending.

## Alternatives Considered

### Expand the top-level `relationship_type` enum

- **ALT-001**: **Description**: Add `spouse`, `parent`, `colleague`, `co_author`,
  … directly to `relationship_type`.
- **ALT-002**: **Rejection Reason**: Explodes the enum, conflates two levels of
  meaning (category vs. role), and breaks existing type-based queries/UX
  grouping.

### Separate `relationship_roles` lookup/junction table

- **ALT-003**: **Description**: Model roles in their own table keyed to the
  relationship.
- **ALT-004**: **Rejection Reason**: Over-engineered for a single optional
  sub-role per edge; a nullable column with conditional CHECK is sufficient and
  keeps reads flat.

## Implementation Notes

- **IMP-001**: Column, type-conditional CHECK, and extended
  `NULLS NOT DISTINCT` unique index in `00014_relationship_role.sql`.
- **IMP-002**: The relationship editor UX (Batch H, #119) surfaces the sub-role
  selector conditioned on the chosen type (ADR-0020, ADR-0025).
- **IMP-003**: Service/Zod schemas
  (`packages/services/src/schemas/character-relationship.ts`) carry the matching
  type→role validation.

## References

- **REF-001**: ADR-0008 (base relationship model — amended here), ADR-0020/0025
  (relationship editor UI)
- **REF-002**: `supabase/migrations/00014_relationship_role.sql`;
  `docs/system-design.md` §7.5; issue #119
- **REF-003**: PostgreSQL `UNIQUE NULLS NOT DISTINCT` documentation

---
title: "ADR-0007: Seven Character Types with Type-Specific Columns + profile_data JSONB"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "characters"]
supersedes: ""
superseded_by: ""
---

# ADR-0007: Seven Character Types with Type-Specific Columns + profile_data JSONB

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00001_initial_schema.sql` (2026-05-21); specified in
`docs/system-design.md` §1.2, §3.2 (`characters`), §14.

## Context

Time Traveler models not just _what_ happened but _who_ was involved, across very
different kinds of actors: real people, animals, mythological figures, fictional
characters, organizations, deities, and artifacts. These share a common spine
(name, biography, temporal birth/death, significance, media, relationships, event
participation) but diverge in a few filterable attributes (an animal has a
species/breed; a deity has a domain) and in long-tail, type-specific metadata.

## Decision

Model all actors in a single `characters` table with a `character_type VARCHAR
CHECK` enum of **seven values**: `human`, `animal`, `mythological`, `fictional`,
`organization`, `divine`, `artifact`. Attribute storage is split three ways:

- **Shared columns** for the common spine (`name`, `biography`, `aliases TEXT[]`,
  `significance`, `birth_temporal`/`death_temporal` JSONB, etc.).
- **Dedicated columns for a few filterable type-specific fields** — `species`,
  `breed`, `domain` — because they are queried/filtered and deserve indexing,
  not burial in JSONB.
- **`profile_data JSONB`** for open-ended, type-specific metadata that should not
  cost a schema change.

Birth/death use the hybrid temporal JSONB (ADR-0005), so a species' emergence and
extinction can be expressed at MYA scale just like a person's CE birth date.

## Consequences

### Positive

- **POS-001**: One table + one enum keeps events, relationships, media, and RLS
  uniform across all actor kinds — a deity and an organization both participate in
  events and relationships through the same junctions.
- **POS-002**: Filterable fields (`species`, `breed`, `domain`) stay first-class
  and indexable (`idx_characters_type`), while `profile_data` absorbs the long
  tail without migrations.
- **POS-003**: Temporal birth/death reuse ADR-0005, so prehistoric/mythological
  actors are representable with the same precision/uncertainty machinery.

### Negative

- **NEG-001**: Type-specific columns are sparse — `species`/`breed` are null for
  most non-animal rows; the cost of a wide-but-sparse table is accepted over
  per-type tables.
- **NEG-002**: `profile_data` is schema-less JSONB: its per-type shape is a
  client/Zod convention, not a DB constraint, so structure drift is possible.
- **NEG-003**: The seven-value enum is fixed in a CHECK constraint; adding an
  eighth type (the PRD hints at places/languages) requires a migration and
  visual-language extension (ADR-0024).

## Alternatives Considered

### One table per character type

- **ALT-001**: **Description**: Separate `humans`, `animals`, `deities`, …
  tables.
- **ALT-002**: **Rejection Reason**: Multiplies junctions, RLS policies, and
  service code by seven; every event-participant query would need a union across
  type tables.

### Single table, everything in JSONB

- **ALT-003**: **Description**: Only `character_type` + a single JSONB blob for
  all attributes.
- **ALT-004**: **Rejection Reason**: Loses indexable/filterable columns and
  full-text search on `name`/`biography`/`aliases`; filtering by species/type
  would require JSONB expression indexes everywhere.

## Implementation Notes

- **IMP-001**: `character_type` enum and the type-specific columns are defined in
  `00001`; `idx_characters_type` and `idx_characters_aliases` (GIN) support
  lookups (`docs/system-design.md` §8.1).
- **IMP-002**: `search_vector` over `name`/`biography`/`aliases` uses
  `immutable_array_to_string` (ADR-0005).
- **IMP-003**: The visual system gives each type an icon + low-chroma tint +
  label (ADR-0024); the enum list is the contract for that mapping.

## References

- **REF-001**: ADR-0005 (temporal birth/death), ADR-0008 (relationships),
  ADR-0024 (character-type-as-identity visuals)
- **REF-002**: `supabase/migrations/00001_initial_schema.sql`;
  `docs/system-design.md` §3.2, §14
- **REF-003**: PRD §3 (character system)

---
title: "ADR-0005: Hybrid Temporal System (JSONB + Generated Sort Columns)"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-21"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "data-model", "temporal", "jsonb"]
supersedes: ""
superseded_by: ""
---

# ADR-0005: Hybrid Temporal System (JSONB + Generated Sort Columns)

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in
`supabase/migrations/00001_initial_schema.sql` (2026-05-21); specified in
`docs/system-design.md` §4.

## Context

Time Traveler must represent dates spanning the Big Bang (~14 billion years ago)
through the speculative future, with precision metadata, uncertainty ranges, and
scientific dating provenance. Native date types cannot express this:
`TIMESTAMPTZ` bottoms out around 4713 BC and JavaScript `Date` is even more
restrictive; a `VARCHAR` date is unbounded but unsortable, unqueryable, and
unvalidated (`docs/system-design.md` §4.1). The system also needs cheap
chronological ordering and range-overlap queries across these wildly different
scales.

## Decision

Store every temporal point as a structured **`temporal_data JSONB`** column
(`{ year, era, precision, uncertainty, geological_period, … }`, eras
`CE/BCE/KYA/MYA/BYA`) and derive an indexable single numeric axis with a
generated column `sort_order_* BIGINT GENERATED ALWAYS AS (… era conversion …)
STORED`. Supporting decisions, all in `00001`:

- **Separate start/end columns** — `temporal_data`/`sort_order_*` and
  `end_temporal_data`/`sort_order_end` are distinct column pairs, not nested,
  enabling range-overlap queries and one-schema-per-object validation
  (§4.3).
- **Computed `TIMESTAMPTZ` for CE dates** — a generated `computed_*_date` column
  materializes a native timestamp for in-range CE dates only, via
  `make_timestamp(...) AT TIME ZONE 'UTC'` (both `IMMUTABLE`, so legal in a
  generated column; `make_timestamptz` is `STABLE` and cannot be used) (§4.5).
- **Integer-only year** — the `(temporal_data->>'year')::BIGINT` cast rejects
  fractional years; sub-year precision is meaningless at KYA/MYA/BYA scale, so
  validation enforces whole integers (§4.4, issues #23/#24).
- **Validation in Zod, not DB CHECK** — JSONB shape is validated in TypeScript
  (`packages/services/src/schemas/temporal.ts`), shared across form/API/seed
  (§4.6).

The era-conversion formula in the generated columns is the canonical sort
mapping reused everywhere; the `TemporalService` (ADR-0019) mirrors it in TS.

## Consequences

### Positive

- **POS-001**: One representation covers cosmological to second-level dates, with
  precision/uncertainty/provenance carried alongside the value.
- **POS-002**: `sort_order_*` collapses all eras to a comparable `BIGINT`, so
  ordering and `WHERE sort_order_years <= :end AND sort_order_end >= :start`
  range queries work across scales and are indexable (ADR-0026 indexes).
- **POS-003**: CE dates still get native timestamp operations via the computed
  column without sacrificing the universal axis.
- **POS-004**: Validation is testable TypeScript shared by forms, services, and
  seeds, not brittle JSONB CHECK constraints.

### Negative

- **NEG-001**: Temporal correctness depends on application-layer (Zod) validation
  — the database does not enforce JSONB shape, so a bad writer bypassing Zod can
  insert malformed `temporal_data`.
- **NEG-002**: Generated columns are constrained to `IMMUTABLE` expressions,
  which forced non-obvious choices (`immutable_array_to_string`,
  `make_timestamp … AT TIME ZONE`) — easy to get wrong when extending.
- **NEG-003**: The era model (`CE/BCE/KYA/MYA/BYA`) is fixed; adding a new scale
  means touching every generated column and the `TemporalService`.

## Alternatives Considered

### Native TIMESTAMPTZ columns

- **ALT-001**: **Description**: Store dates in PostgreSQL's native timestamp type.
- **ALT-002**: **Rejection Reason**: Cannot represent anything before ~4713 BC —
  excludes the prehistoric/geological/cosmological range that is core to the
  product.

### VARCHAR date strings

- **ALT-003**: **Description**: Free-form date text.
- **ALT-004**: **Rejection Reason**: No sorting, no range queries, no validation
  — unusable for a timeline product.

### End dates nested inside the start JSONB (the v2 design)

- **ALT-005**: **Description**: Embed `end_year`/`end_era` inside `temporal_data`.
- **ALT-006**: **Rejection Reason**: Breaks clean range-overlap queries and forces
  a two-schema JSONB object; separate columns are simpler (§4.3).

## Implementation Notes

- **IMP-001**: Era conversion: `CE → year`, `BCE → -year`, `KYA → -year×1e3`,
  `MYA → -year×1e6`, `BYA → -year×1e9` (`00001`; `docs/system-design.md` §4.4).
- **IMP-002**: `immutable_array_to_string` is the sanctioned `IMMUTABLE` wrapper
  for `array_to_string` inside generated `search_vector` columns — reuse it,
  don't reinvent (`00001`).
- **IMP-003**: Logarithmic display positioning (`sign × log10(|sort| + 1)`) is a
  client concern in `TemporalService`, not stored (§6.3).

## References

- **REF-001**: ADR-0011 (publication columns alongside temporal),
  ADR-0013 (`events_in_temporal_range` read function), ADR-0019 (TemporalService),
  ADR-0026 (temporal indexes)
- **REF-002**: `supabase/migrations/00001_initial_schema.sql`;
  `docs/system-design.md` §4, §6
- **REF-003**: PostgreSQL generated columns + `IMMUTABLE` function requirements

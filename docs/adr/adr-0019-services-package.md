---
title: "ADR-0019: @repo/services Package — Clients, Zod Schemas, Modules, Generated Types"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "services", "validation"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0019: @repo/services Package — Clients, Zod Schemas, Modules, Generated Types

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented as
`packages/services` (`@repo/services`); specified in `docs/system-design.md` §11.
Consumes the thin-service-layer decision (ADR-0012).

## Context

Both apps (`admin`, and later a reader surface) need to talk to Supabase with the
same client setup, validation, and typed result shapes. Duplicating Supabase
client creation, Zod schemas, and the generated DB types in each app would drift.
The temporal logic (era-conversion `sort_order` math, ADR-0005) also needs one
canonical TypeScript home.

## Decision

Create a shared **`@repo/services`** package as the single data-access layer. It
contains four concerns, mirrored by its `src/` layout:

- **`src/supabase/`** — Supabase client factories (browser/server via
  `@supabase/ssr`) and the **generated `types.ts`** (`pnpm run db:gen:types`),
  keeping the database schema and TS types in lockstep.
- **`src/schemas/`** — **Zod schemas** that validate at the boundary (ADR-0012),
  including the per-`character_type` `profile_data` shapes (ADR-0007) and the
  type→`relationship_role` rules (ADR-0009).
- **`src/modules/`** — the **thin service modules** that compose PostgREST calls
  and the read functions (ADR-0013) into typed operations.
- **`src/utils/`** — shared helpers, including the **TemporalService** logic that
  computes/validates the hybrid temporal encoding (ADR-0005).

The package is ESM, strict-TS, lint-clean, and Vitest-tested with an 80% coverage
gate (ADR-0026).

## Consequences

### Positive

- **POS-001**: One place for clients, schemas, types, and temporal logic — no
  per-app duplication or drift.
- **POS-002**: Generated `types.ts` ties application types to the actual schema;
  regenerating after a migration surfaces breakages at compile time.
- **POS-003**: Zod schemas centralize boundary validation that PostgREST/RLS can't
  express (per-type JSONB, conditional roles), keeping apps thin.

### Negative

- **NEG-001**: `types.ts` must be regenerated whenever migrations change shapes;
  forgetting leaves the package out of sync with the DB.
- **NEG-002**: Zod schemas duplicate some constraints already in the schema
  (CHECKs, enums); they must be kept consistent with migrations by convention.
- **NEG-003**: Centralizing temporal math here means any era-conversion change must
  match the SQL `sort_order` generated columns exactly (ADR-0005).

## Alternatives Considered

### Per-app data layers

- **ALT-001**: **Description**: Each app builds its own Supabase clients, schemas,
  and types.
- **ALT-002**: **Rejection Reason**: Guarantees drift across apps and duplicates
  the temporal logic that must stay identical.

### Generated types only, no service/schema layer

- **ALT-003**: **Description**: Ship just `types.ts` and call `supabase-js`
  directly from apps.
- **ALT-004**: **Rejection Reason**: Leaves boundary validation and multi-step
  composition (ADR-0012) scattered in UI code.

## Implementation Notes

- **IMP-001**: Layout `packages/services/src/{supabase,schemas,modules,utils}`;
  exports via `@repo/services/*` (`packages/services/package.json`).
- **IMP-002**: `pnpm run db:gen:types` writes
  `packages/services/src/supabase/types.ts`.
- **IMP-003**: Vitest config + 80% coverage gate in
  `packages/services/vitest.config.ts` (ADR-0026).

## References

- **REF-001**: ADR-0005 (temporal logic), ADR-0007 (per-type schemas), ADR-0009
  (role schemas), ADR-0012 (thin service layer), ADR-0013 (read functions),
  ADR-0026 (testing)
- **REF-002**: `packages/services/`; `docs/system-design.md` §11
- **REF-003**: `@supabase/ssr`, Zod, Supabase type generation docs

---
title: "ADR-0026: Testing Strategy — pgTAP for the Database, Vitest (80%) for Packages, Storybook for UI"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "testing", "quality"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0026: Testing Strategy — pgTAP for the Database, Vitest (80%) for Packages, Storybook for UI

## Status

**Accepted (retroactively documented 2026-05-30)** — realized by
`supabase/tests/database/` (pgTAP), `packages/{ui,services}/vitest.config.ts`
(Vitest + coverage), and `packages/ui/.storybook/` (Storybook). Reflected in the
root `coverage/` merge and `scripts/fix-lcov-paths.mjs`.

## Context

The system's correctness lives in three different layers: the database (schema
constraints, RLS policies, functions — ADR-0014/0015), shared TypeScript logic
(temporal math, schemas, service modules — ADR-0019), and UI primitives
(ADR-0020). Each layer needs a test tool suited to it; a single framework can't
meaningfully assert RLS behavior _and_ React rendering. There is no app-level test
suite yet because the apps are still being built out.

## Decision

Adopt a **layered testing strategy**:

- **pgTAP** for the **database** — tests in `supabase/tests/database/`, run via
  `pnpm run db:test`, asserting schema constraints, the RLS policy matrix
  (published/owner/admin/collaborator), and function behavior. This is the only
  way to test RLS the way it actually runs.
- **Vitest with an 80% coverage gate** for **`packages/ui` and
  `packages/services`** — `pnpm run test` / `pnpm run test:coverage`. Coverage
  reports are merged at the repo root (`coverage/lcov.info`), with
  `scripts/fix-lcov-paths.mjs` normalizing monorepo paths.
- **Storybook** for **UI primitives** — colocated `*.stories.tsx` plus composite
  "Pages > \*" mockups provide visual review/snapshots (ADR-0020).
- **Apps are not yet in the test workspace** — they are added only once they
  contain unit-testable logic, to avoid coverage theater on boilerplate.

## Consequences

### Positive

- **POS-001**: RLS and DB functions are tested in-database (pgTAP), where their
  real behavior is observable — not approximated in app mocks.
- **POS-002**: The 80% Vitest gate enforces real coverage on the shared logic
  (temporal math, schemas, services) that the apps depend on.
- **POS-003**: Storybook gives the design system a visual regression/review
  surface aligned with the component workbench (ADR-0020).

### Negative

- **NEG-001**: Three test tools mean three skill sets and three CI/local
  invocations to keep green.
- **NEG-002**: The 80% gate can pressure low-value tests if applied to trivial
  code; mitigated by keeping apps out until they have real logic.
- **NEG-003**: Merging coverage across packages requires the
  `fix-lcov-paths.mjs` shim — a small piece of bespoke tooling to maintain.

## Alternatives Considered

### One framework for everything

- **ALT-001**: **Description**: Test RLS/DB logic from TypeScript with mocks.
- **ALT-002**: **Rejection Reason**: Can't faithfully exercise RLS/policies/SQL
  functions; pgTAP runs the real policy engine.

### No coverage gate

- **ALT-003**: **Description**: Run Vitest without a threshold.
- **ALT-004**: **Rejection Reason**: Loses the enforced quality bar on shared
  packages; 80% is the documented contract.

## Implementation Notes

- **IMP-001**: pgTAP tests in `supabase/tests/database/`, run by `pnpm run db:test`.
- **IMP-002**: Vitest configs + 80% threshold in
  `packages/{ui,services}/vitest.config.ts`; root coverage merge via
  `scripts/fix-lcov-paths.mjs`.
- **IMP-003**: Add apps to the test workspace only when they hold unit-testable
  code.

## References

- **REF-001**: ADR-0014/0015 (RLS under pgTAP), ADR-0019 (services under Vitest),
  ADR-0020 (Storybook)
- **REF-002**: `supabase/tests/database/`; `packages/{ui,services}/vitest.config.ts`;
  `scripts/fix-lcov-paths.mjs`; `coverage/`
- **REF-003**: pgTAP, Vitest, Storybook docs

## Amendment (2026-06-19) — `apps/admin` enters the Vitest workspace

IMP-003 anticipated this: apps join the test workspace once they hold
unit-testable logic. The #49 media feature added the first such code in an app —
`apps/admin/.../_components/media/{attach-media-dialog,media-section}.tsx`
(client-side size validation, sort_order renormalization, detach-vs-delete
confirmation, primary-swap branching) — so `apps/admin` now has its own
`vitest.config.ts` and `test` / `test:coverage` scripts, picked up by
`turbo run test:coverage`.

To keep faith with "no coverage theater on boilerplate," the app's coverage
`include` is **scoped to the files that have tests** (same approach as
`packages/ui`), not the whole app, while keeping the 80% threshold on that scope.
Expand the `include` list as more app components gain tests. This is an extension
of the existing strategy, not a new layer — there is still **no end-to-end/browser
test layer**; standing one up would be a separate decision.

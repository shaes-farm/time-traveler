---
title: "ADR-0004: Engineering Standards — Strict TS, Zero-Warning Lint, ESM, Supply-Chain Delay"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-03-01"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags:
  ["architecture", "decision", "standards", "typescript", "eslint", "security"]
supersedes: ""
superseded_by: ""
---

# ADR-0004: Engineering Standards — Strict TS, Zero-Warning Lint, ESM, Supply-Chain Delay

## Status

**Accepted (retroactively documented 2026-05-30)** — dated to the shared config
packages and root tooling (`packages/eslint-config`, `packages/typescript-config`,
`pnpm-workspace.yaml`, `.npmrc`).

## Context

A monorepo with a typed Supabase service layer, shared UI primitives, and several
apps needs uniform, enforced engineering standards so that quality does not drift
per-package and so that automated agents and contributors produce consistent
code. The standards must be machine-enforced (in CI and pre-commit), not
convention-by-documentation.

## Decision

Adopt four repo-wide, machine-enforced standards, packaged as shared config and
root settings:

1. **Strict TypeScript** — `strict`, `strictNullChecks`, and
   `noUncheckedIndexedAccess` enabled in `@repo/typescript-config`; all types
   explicit, no implicit `any`.
2. **Zero-warning ESLint** — every app/package runs `eslint --max-warnings 0`
   via `@repo/eslint-config`; a warning fails the build.
3. **ESM everywhere** — apps and packages declare `"type": "module"` and use
   ESM `import`/`export`.
4. **Supply-chain release delay** — `minimumReleaseAge: 10` (minutes) in
   `pnpm-workspace.yaml` and `minimum-release-age=10 minutes` in `.npmrc`, plus
   an explicit `allowBuilds` allowlist (`esbuild`, `sharp`), so freshly published
   (and quickly-withdrawn) malicious package versions cannot be installed
   immediately.

## Consequences

### Positive

- **POS-001**: `noUncheckedIndexedAccess` + strict null checks catch a large
  class of runtime errors at compile time, which matters for the dynamic JSONB
  temporal data and generated DB types.
- **POS-002**: Zero-warning lint prevents slow quality erosion; there is no
  "acceptable warning" backlog.
- **POS-003**: ESM-everywhere removes dual-module hazards and aligns with Next 16
  / Deno Edge Functions.
- **POS-004**: The release-age delay closes the immediate-publish supply-chain
  attack window without blocking ordinary day-old dependencies.

### Negative

- **NEG-001**: Strict settings and zero-warning lint raise the cost of quick
  prototypes; every change must be type-clean and lint-clean to merge.
- **NEG-002**: `noUncheckedIndexedAccess` adds null-guard ceremony around array
  and record access.
- **NEG-003**: The release-age gate can briefly block adopting a just-published
  fix; the `allowBuilds` allowlist must be maintained as native-build deps change.

## Alternatives Considered

### Loose/default TypeScript + warnings allowed

- **ALT-001**: **Description**: Default `tsconfig` strictness and ESLint run
  without `--max-warnings 0`.
- **ALT-002**: **Rejection Reason**: Permits null-safety gaps and a growing
  warning backlog that erodes signal; rejected for a typed, multi-author repo.

### No supply-chain delay

- **ALT-003**: **Description**: Install any published version immediately.
- **ALT-004**: **Rejection Reason**: Leaves the repo exposed to publish-then-yank
  malware; a 10-minute floor is a near-zero-cost mitigation.

## Implementation Notes

- **IMP-001**: Standards live in `@repo/typescript-config` (`base.json`,
  `nextjs.json`, `react-library.json`) and `@repo/eslint-config` (`base`,
  `next`, `react-internal`), extended by every app/package.
- **IMP-002**: Enforced in CI (lint, type-check, build, test jobs) and locally
  via Husky pre-commit and the root `verify` script.
- **IMP-003**: `prettier` formats `{ts,tsx,md}`; `format:check` gates CI.

## References

- **REF-001**: ADR-0002 (monorepo), ADR-0026 (testing strategy)
- **REF-002**: `packages/typescript-config/*`, `packages/eslint-config/*`,
  `pnpm-workspace.yaml`, `.npmrc`, `.github/copilot-instructions.md`
- **REF-003**: pnpm `minimumReleaseAge` documentation

---
title: "ADR-0002: pnpm + Turborepo Monorepo"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-03-01"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "monorepo", "tooling", "turborepo", "pnpm"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0002: pnpm + Turborepo Monorepo

## Status

**Accepted (retroactively documented 2026-05-30)** — dated to the project
structure recorded in `docs/system-design.md` §11 and realized in the repository
root (`pnpm-workspace.yaml`, `turbo.json`).

## Context

Time Traveler comprises multiple deployable surfaces (an admin app, a docs app,
and a future public reader) plus shared infrastructure: UI primitives, the
Supabase service layer, and shared lint/TypeScript configuration. These need to
share types and components without publishing internal packages to a registry,
and the build must guarantee that shared packages are built before the apps that
consume them.

## Decision

Use a **pnpm workspace** orchestrated by **Turborepo**, with two top-level
globs: `apps/*` (deployable Next.js apps — `admin`, `docs`) and `packages/*`
(shared libraries — `@repo/ui`, `@repo/services`, `@repo/eslint-config`,
`@repo/typescript-config`). The Turborepo task graph declares `build` depends on
`^build`, so internal packages build before the apps. See
`pnpm-workspace.yaml`, `turbo.json`, and `docs/system-design.md` §11.

## Consequences

### Positive

- **POS-001**: Shared code (`@repo/ui`, `@repo/services`) is consumed by source
  import across the workspace with no publish step and no version skew.
- **POS-002**: pnpm's content-addressed store keeps installs fast and disk-cheap;
  strict hoisting surfaces undeclared dependencies early.
- **POS-003**: Turborepo caching makes incremental `build`/`lint`/`check-types`
  near-instant ("FULL TURBO") and the `^build` edge prevents app-before-package
  build ordering bugs.
- **POS-004**: A single root `verify` script
  (`format:check && lint && check-types && test:coverage && build`) gives one
  command that mirrors CI.

### Negative

- **NEG-001**: Contributors must understand the task graph — building a single
  app in isolation without its package dependencies is a known footgun (noted in
  `CLAUDE.md`).
- **NEG-002**: Workspace tooling (pnpm version pin, Turbo config) is additional
  surface to keep current across Node/toolchain upgrades.

## Alternatives Considered

### Multiple independent repositories

- **ALT-001**: **Description**: One repo per app/library, sharing code via
  published npm packages.
- **ALT-002**: **Rejection Reason**: Version-skew and release friction for code
  that changes together; cross-cutting changes (a schema type plus its UI plus
  its service) would span multiple PRs across repos.

### npm/yarn workspaces without Turborepo

- **ALT-003**: **Description**: A workspace using npm or Yarn and bespoke scripts
  for task orchestration.
- **ALT-004**: **Rejection Reason**: No incremental task cache or dependency-aware
  task graph; build ordering and caching would be hand-maintained.

## Implementation Notes

- **IMP-001**: Workspace globs `apps/*`, `packages/*` in `pnpm-workspace.yaml`;
  package manager pinned via `package.json` `packageManager` (`pnpm@11.2.2`).
- **IMP-002**: Shared configs are themselves packages
  (`@repo/eslint-config`, `@repo/typescript-config`) extended by each app/package
  (see ADR-0004).
- **IMP-003**: Coverage from every package is merged at the root
  (`merge:coverage`) for a single repo-level report.

## References

- **REF-001**: ADR-0003 (apps), ADR-0004 (shared standards), ADR-0019/0020
  (`@repo/services`, `@repo/ui`)
- **REF-002**: `docs/system-design.md` §11; `pnpm-workspace.yaml`; `turbo.json`
- **REF-003**: Turborepo + pnpm workspace documentation

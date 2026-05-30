---
title: "ADR-0020: @repo/ui Design System on shadcn/ui + Tailwind 4 (in packages/ui, Storybook workbench)"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-26"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "design-system", "ui"]
supersedes: ""
superseded_by: ""
---

# ADR-0020: @repo/ui Design System on shadcn/ui + Tailwind 4 (in packages/ui, Storybook workbench)

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented across
fidelity-2 Batches A–H (PRs #149–#162); specified in
`docs/design/admin/fidelity-2-plan.md`. Closes #37/#38.

## Context

`apps/admin` started as Turborepo boilerplate. The fidelity-1 wireframes
(`docs/design/admin/02-wireframes/`) require a dense, dark, table-first admin UI.
The team needed a component foundation that is customizable enough to escape the
"generic shadcn dashboard" look the aesthetic notes explicitly reject, while
remaining shared across apps.

## Decision

Build a shared **`@repo/ui` design system on shadcn/ui + Tailwind 4**, with these
placement and tooling decisions:

- **shadcn lives in `packages/ui`, not `apps/admin`** — primitives are shared
  infrastructure, exported via `@repo/ui/components/*`. (Diverges from #37's "init
  in `apps/admin`" instruction — flagged in the closing PR.)
- **Tailwind 4 CSS-first** config (no `tailwind.config.js`); `@theme` block in
  `tokens.css` (ADR-0022). Existing CSS Modules stay for route-level layout.
- **Storybook 10 + Vite preset** as the component workbench in `packages/ui`, with
  colocated `*.stories.tsx` and composite "Pages > \*" mockups for each wireframed
  screen.
- **shadcn for every primitive except `Tree`** — `Tree` is the only bespoke
  primitive (no shadcn equivalent); `DataTable` uses tanstack-table + shadcn
  `Table` markup (ADR-0025).

## Consequences

### Positive

- **POS-001**: Primitives are monorepo-shared and consumable by any app via
  `@repo/ui`, not trapped in `apps/admin`.
- **POS-002**: A heavily themed shadcn base gives accessible, well-tested
  primitives while the token system (ADR-0022) escapes the generic look.
- **POS-003**: Storybook + composite page stories let every wireframed screen be
  reviewed visually before a production route exists.

### Negative

- **NEG-001**: Placing shadcn in `packages/ui` diverges from shadcn's app-centric
  defaults, so `components.json`/aliases needed custom wiring.
- **NEG-002**: Tailwind 4 CSS-first + tokens-in-two-files is newer ground; token
  sync is a manual discipline (ADR-0022).
- **NEG-003**: Maintaining Storybook (Vite) alongside Vitest adds a second tooling
  surface in `packages/ui`.

## Alternatives Considered

### Initialize shadcn directly in `apps/admin` (per #37)

- **ALT-001**: **Description**: Keep primitives inside the admin app.
- **ALT-002**: **Rejection Reason**: Not monorepo-correct — primitives are shared
  infrastructure; a second app would have to duplicate or reach into `apps/admin`.

### A different component library (MUI, Mantine, Chakra)

- **ALT-003**: **Description**: Adopt a batteries-included component kit.
- **ALT-004**: **Rejection Reason**: Harder to theme to the dense/dark/editorial
  target; shadcn's copy-in, own-the-code model fits the heavy customization the
  aesthetic notes demand.

## Implementation Notes

- **IMP-001**: Primitives in `packages/ui/src/components/`; tokens in
  `packages/ui/src/styles/` (ADR-0022); `components.json` in `packages/ui`.
- **IMP-002**: Storybook config in `packages/ui/.storybook/`; `storybook-static/`
  git/eslint-ignored.
- **IMP-003**: App shell + route groups in
  `apps/admin/app/{(public),(protected),(admin),auth}/` consume `@repo/ui`.

## References

- **REF-001**: ADR-0022 (tokens), ADR-0023 (dark-mode-only), ADR-0024 (visual
  language), ADR-0025 (primitive sourcing), ADR-0026 (Storybook/tests)
- **REF-002**: `docs/design/admin/fidelity-2-plan.md`;
  `docs/design/admin/03-aesthetic-notes.md`; `packages/ui/`
- **REF-003**: shadcn/ui, Tailwind 4, Storybook 10 docs

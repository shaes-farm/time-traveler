---
title: "ADR-0022: Dual-Source Design Tokens (tokens.ts + tokens.css), OKLCH, Locked Icon/Font Set"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-26"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "design-tokens"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0022: Dual-Source Design Tokens (tokens.ts + tokens.css), OKLCH, Locked Icon/Font Set

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in fidelity-2
Batch A (PR #149); specified in `docs/design/admin/fidelity-2-plan.md`
("Locked-in stack", "Where things live") and
`docs/design/admin/03-aesthetic-notes.md`.

## Context

The design system needs a single conceptual source for color/typography/radius
tokens that is consumable both by TypeScript code (for typed token references in
components/stories) and by Tailwind 4's CSS-first `@theme` mechanism. A full
token build pipeline (e.g., Style Dictionary) is more machinery than two small
files justify at this stage.

## Decision

Adopt a **dual-source token system** with a hand-sync discipline:

- **`packages/ui/src/styles/tokens.ts`** — the **TypeScript source-of-truth**
  (typed token objects).
- **`packages/ui/src/styles/tokens.css`** — the Tailwind 4 `@theme` block,
  **hand-synced** from `tokens.ts`. The two files are intentionally small; a build
  step isn't worth the indirection "until they diverge."
- Colors are expressed in **OKLCH** (perceptually uniform — load-bearing for the
  accessible era palette in ADR-0024).
- **Icon set locked to lucide-react**; **fonts locked** to **Fraunces** (display,
  standing in for licensed GT Sectra), **Inter Tight** (body), **JetBrains Mono**
  (IDs/slugs/JSONB), loaded via `next/font` and bound to CSS variables.
- `globals.css` is the entry point (sets `color-scheme: dark`, tabular-numeral
  font-feature-settings); `apps/admin` re-imports `@repo/ui/styles/globals.css`.

`tokens.ts`/`tokens.css` are declared the canonical values; design docs defer to
them if they drift.

## Consequences

### Positive

- **POS-001**: One conceptual token source feeds both typed TS references and
  Tailwind's CSS-first theme without a codegen step.
- **POS-002**: OKLCH makes lightness/chroma adjustments perceptually predictable —
  essential for the colorblind-safe era hues (ADR-0024) and the sequential
  importance/significance ramps.
- **POS-003**: Locking the icon set and fonts (with documented substitutions)
  keeps the visual language consistent and the bundle predictable.

### Negative

- **NEG-001**: The two token files are **hand-synced** — they can drift; the
  discipline is "code wins, update docs." A future divergence is the documented
  trigger to introduce codegen.
- **NEG-002**: Fraunces/Inter Tight are acknowledged substitutes/"slop-tier" picks
  pending licensed alternatives; the font choice is provisional.
- **NEG-003**: Some character-type tint token slots are specified but not yet added
  to the files (deferred to the type-badge primitive — ADR-0024).

## Alternatives Considered

### A token build pipeline (Style Dictionary / codegen)

- **ALT-001**: **Description**: Generate `tokens.css` from `tokens.ts`
  automatically.
- **ALT-002**: **Rejection Reason**: More machinery than two tiny files warrant
  now; revisit when they diverge.

### Single source (CSS-only or TS-only)

- **ALT-003**: **Description**: Keep tokens in just one file.
- **ALT-004**: **Rejection Reason**: CSS-only loses typed TS references; TS-only
  can't feed Tailwind 4's `@theme` directly — both consumers are needed.

## Implementation Notes

- **IMP-001**: `tokens.ts`, `tokens.css`, `globals.css` in
  `packages/ui/src/styles/`; token Storybook stories (`colors`, `spacing`,
  `typography`) document them.
- **IMP-002**: Fonts via `next/font` in `apps/admin/app/layout.tsx`, bound to
  `--font-*` variables.
- **IMP-003**: OKLCH era/importance/type values live here as the source of truth
  for ADR-0024.

## References

- **REF-001**: ADR-0020 (design system), ADR-0023 (dark-mode default in
  globals.css), ADR-0024 (palette values consuming these tokens)
- **REF-002**: `packages/ui/src/styles/{tokens.ts,tokens.css,globals.css}`;
  `docs/design/admin/fidelity-2-plan.md`; `docs/design/admin/03-aesthetic-notes.md`
- **REF-003**: Tailwind 4 `@theme`, OKLCH, lucide-react docs

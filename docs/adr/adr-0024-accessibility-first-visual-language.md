---
title: "ADR-0024: Accessibility-First Visual Language — Era Hue-Spread + Character-Type Identity"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-26"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags:
  ["architecture", "decision", "frontend", "accessibility", "visual-language"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0024: Accessibility-First Visual Language — Era Hue-Spread + Character-Type Identity

## Status

**Accepted (retroactively documented 2026-05-30)** — specified in
`docs/design/admin/03-aesthetic-notes.md` ("Visual design language (finalized)")
and `docs/design/admin/fidelity-2-plan.md` (Batch J). **Reconciles PRD §7.2.2 in
place** (no separate issue — fixed directly, mirroring the #127 approach).

## Context

Eras (CE/BCE/KYA/MYA/BYA) and the seven character types (ADR-0007) must be
scannable in dense lists, headers, and pickers. PRD §7.2.2's original era palette
(blue/amber/brown/green/purple) clustered brown↔amber↔green in the warm-to-yellow
band — exactly where red-green colorblind users lose separation. Color used as the
_only_ signal also fails accessibility.

## Decision

Adopt an **accessibility-first visual language**:

- **Era differentiates by hue spread evenly around the wheel** (OKLCH): CE amber
  (60), BCE gold (100), KYA teal (200), MYA blue (260), BYA magenta (320) — maximizing
  inter-era hue distance instead of the clustered PRD set. **PRD §7.2.2 was updated
  in place** to this palette; `tokens.css`/`tokens.ts` remain the source of truth.
- **Hue is never the only signal.** `TemporalDisplay` (#158) renders the literal era
  code in mono beside the value, so colorblind users read the token regardless of
  hue. Uncertainty renders quietly (muted prefix `c.`/`~`/`est.`, `± years`,
  hairline range bar only when ambiguity is real — >100yr OR >1000yr span OR crosses
  an era boundary).
- **Character type is identity:** each of the seven types gets a **lucide icon +
  low-chroma tint + the literal label** — **never icon-alone**. Tints stay
  low-chroma so seven categorical colors don't fight the era accents or the
  importance/significance sequential ramp when co-occurring in a row.
- **Significance reuses the importance sequential single-hue ramp** (amber 55,
  rising lightness/chroma) — same visual language for "how much does this matter."
- Anti-patterns enforced: **no purple gradients**; **density over delight** (no
  scroll-driven animation, custom cursors, parallax, magnetic buttons).

## Consequences

### Positive

- **POS-001**: Era separation survives red-green colorblindness (hue spread) and
  monochrome (literal era code), satisfying the load-bearing accessibility goal.
- **POS-002**: Character type, era, and significance each have a consistent,
  reinforced (color + text/icon) encoding that reads fast without relying on color
  alone.
- **POS-003**: Reusing the importance ramp for significance avoids a second color
  language and keeps dense rows calm.

### Negative

- **NEG-001**: Maintaining colorblind-safe hue distances constrains future palette
  additions (an 8th era/type must preserve separation).
- **NEG-002**: The "never icon-alone / always literal era code" rules add markup
  obligations to every list/badge primitive.
- **NEG-003**: Character-type tint token slots are specified but not yet added to
  `tokens.ts`/`tokens.css` (deferred to the type-badge primitive).

## Alternatives Considered

### Keep PRD §7.2.2's original clustered era palette

- **ALT-001**: **Description**: blue/amber/brown/green/purple per the PRD.
- **ALT-002**: **Rejection Reason**: brown↔amber↔green cluster fails red-green
  colorblindness; replaced by an evenly hue-spread palette.

### Color-only era/type encoding (no literal label/code)

- **ALT-003**: **Description**: Rely on the tint/hue alone.
- **ALT-004**: **Rejection Reason**: Fails colorblind and monochrome users; the
  literal era code and type label are mandatory reinforcement.

## Implementation Notes

- **IMP-001**: Era/importance OKLCH values in `tokens.ts`/`tokens.css` (ADR-0022);
  `TemporalDisplay` (#158) and `StatusBadge` consume them.
- **IMP-002**: Range-bar trigger rule from wireframe
  `02-wireframes/08-event-detail.md` annotation #5.
- **IMP-003**: PRD §7.2.2 reconciled in place; divergence table recorded in
  `03-aesthetic-notes.md`.

## References

- **REF-001**: ADR-0007 (seven types), ADR-0005 (temporal display source),
  ADR-0022 (tokens), ADR-0023 (dark-only), ADR-0027 (PRD-reconciliation protocol)
- **REF-002**: `docs/design/admin/03-aesthetic-notes.md`;
  `docs/design/admin/fidelity-2-plan.md`; PRD §7.2.2; PRD §7.11
- **REF-003**: OKLCH, WCAG color-contrast, colorblind-simulation guidance

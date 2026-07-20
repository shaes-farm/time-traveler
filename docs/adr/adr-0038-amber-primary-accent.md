---
title: "ADR-0038: Amber primary accent (Batch B finalization)"
status: "Accepted"
date: "2026-07-19"
authors: "Time Traveler maintainers"
tags: ["design-system", "tokens", "decision"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0038: Amber primary accent (Batch B finalization)

## Status

**Accepted**

## Context

`--color-primary` has carried a deliberate placeholder value since the token
layer landed: zinc-50 "high contrast" with a zinc-950 foreground, annotated
"Primary accent — placeholder; finalized in Batch B" in
`packages/ui/src/styles/tokens.css` (and the matching note in `tokens.ts`).
Every primary-styled control in the design system — buttons, badges,
checkboxes, switches — has therefore rendered as white-on-dark, indistinct
from plain foreground emphasis.

The public-reader hi-fi landing design
(`docs/design/public/08-high-fidelity/Time_Traveler_Landing_Final.html`)
resolves the accent: all primary CTAs, brand marks, and links use a warm
amber `oklch(0.80 0.12 66)` with near-black text (`#160f04`) on amber fills.
The mid-fidelity landing spec
(`docs/design/public/06-mid-fidelity/01-landing.md`) already binds the hero
Explore CTA to `--color-primary` / `--color-primary-foreground`, so the
mockup's amber is the concrete value that slot has been waiting for. The
amber also sits adjacent to the existing warm-hue family (`--color-era-ce`
at hue 60, the importance gradient at hue 55), so it reads as native to the
palette rather than a new hue axis.

## Decision

Finalize the primary accent pair, design-system-wide (admin and reader —
the token layer is shared via `@repo/ui/styles`):

- `--color-primary: oklch(0.80 0.12 66)` — warm amber, from the hi-fi
  landing mockup.
- `--color-primary-foreground: oklch(0.17 0.02 66)` — near-black warm ink
  (≈ the mockup's `#160f04`), giving amber fills ~10:1 contrast (AAA).

`--color-ring` continues to alias `var(--color-foreground)` — focus rings
are intentionally unaffected by this promotion.

Both token files (`tokens.css` and `tokens.ts`) are updated together per
their manual-sync contract.

## Consequences

### Positive

- **POS-001**: Primary actions become visually distinct from plain
  foreground text; call-to-action hierarchy finally reads at a glance.
- **POS-002**: Reader landing, admin, and Storybook share one accent —
  no reader-only fork of the primary slot.
- **POS-003**: Amber harmonizes with the existing warm accents
  (`era-ce` hue 60, importance ramp hue 55) — no new hue axis introduced.

### Negative

- **NEG-001**: Every consumer of `primary` / `primary-foreground` restyles
  at once. In `packages/ui`: `button.tsx` (default variant), `badge.tsx`
  (default), `checkbox.tsx` (checked), `radio-group.tsx`, `slider.tsx`
  (range + thumb), `switch.tsx` (checked), `sonner.tsx` (action button),
  `tree.tsx` (selected wash), `media-card.tsx` (selected ring + check
  tile), `auth-layout.tsx` (logo tile), plus every Button consumer
  (`alert-dialog`, `publish-control`, `bulk-action-bar`, `media-picker`,
  …). All admin routes using these primitives turn amber. This is the
  intended meaning of "finalized primary", not collateral damage.
- **NEG-002**: Any screenshot-based expectations (Storybook review,
  marketing captures) go stale and need re-capture.

## Alternatives Considered

### Reader-scoped brand token (`--color-brand`)

- **ALT-001**: **Description**: Add a separate amber token used only by the
  reader landing; leave `--color-primary` a placeholder.
- **ALT-002**: **Rejection Reason**: Leaves the placeholder debt in place
  and forks the accent vocabulary; the mid-fi spec already binds the
  landing CTA to `--color-primary`.

### Reuse `--color-era-ce` for CTAs

- **ALT-003**: **Description**: Style primary CTAs with the existing CE era
  accent `oklch(0.78 0.10 60)`.
- **ALT-004**: **Rejection Reason**: Overloads a semantic era signal
  (TemporalDisplay's colorblind-safe pairing) with an interactive-emphasis
  role; era hues must stay reserved for temporal metadata.

## Implementation Notes

- **IMP-001**: Update `packages/ui/src/styles/tokens.css` and
  `packages/ui/src/styles/tokens.ts` in the same commit (manual-sync
  contract in both file headers).
- **IMP-002**: Visual smoke pass over Storybook primary-consuming stories
  (Button, Badge, Checkbox, Radio, Slider, Switch, Sonner) and an admin
  spot check (login, list pages, publish control).
- **IMP-003**: Success criterion: amber fills pass AA (≥4.5:1) for the
  `primary-foreground` text they carry; ring/focus visuals unchanged.

## References

- **REF-001**: [ADR-0030 — public reader app placement](adr-0030-public-reader-app-placement.md), [ADR-0031 — public reader design divergence](adr-0031-public-reader-design-divergence.md) (reader/admin share the `@repo/ui` token layer)
- **REF-002**: `docs/design/public/08-high-fidelity/Time_Traveler_Landing_Final.html` (source of the amber value)
- **REF-003**: `docs/design/public/06-mid-fidelity/01-landing.md` (hero CTA bound to `--color-primary`)

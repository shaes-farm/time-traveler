---
title: "ADR-0023: Dark-Mode-Only for Fidelity-2 (Light Mode Deferred)"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-26"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "theming"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0023: Dark-Mode-Only for Fidelity-2 (Light Mode Deferred)

## Status

**Accepted (retroactively documented 2026-05-30)** — implemented in fidelity-2
Batch A (PR #149); specified in `docs/design/admin/fidelity-2-plan.md`
("Locked-in stack" → Dark mode strategy) and
`docs/design/admin/03-aesthetic-notes.md` ("Color direction").

## Context

The aesthetic notes commit to dark mode as the default for a CMS where users
stare at structured forms for hours, and state that light mode "should exist but
not be the default." Supporting both themes from day one doubles the token surface
(every era/importance/type color needs a verified light variant) and slows the
fidelity-2 push to replace boilerplate with a working themed shell.

## Decision

Ship **dark mode only** in fidelity-2: set **`color-scheme: dark` as the default**
in `globals.css` and **defer the class-based light-mode toggle**. The token system
(ADR-0022) carries only dark-mode values for now; light-mode era values and the
toggle are explicitly postponed. (This diverges from #37's expectations and is
flagged in the closing PR.)

## Consequences

### Positive

- **POS-001**: Keeps the token surface small — one set of OKLCH values to verify
  for contrast and colorblind-safety (ADR-0024) instead of two.
- **POS-002**: Matches the documented "dark default" product intent for long
  editing sessions.
- **POS-003**: Unblocks the fidelity-2 shell/auth/primitive work without waiting on
  a full light palette.

### Negative

- **NEG-001**: No light mode yet — users who prefer/ need light themes are
  unserved until the deferred work lands.
- **NEG-002**: Adding light mode later requires authoring and verifying a full
  parallel set of era/importance/type tokens plus a class-based toggle, retrofitted
  across already-built primitives.
- **NEG-003**: Diverges from #37's stated expectation (flagged, not silent).

## Alternatives Considered

### Support light + dark from the start

- **ALT-001**: **Description**: Build both themes and a toggle in fidelity-2.
- **ALT-002**: **Rejection Reason**: Doubles the token/verification surface
  (especially the colorblind-safe era hues) and slows the boilerplate-removal
  milestone for a mode the product treats as secondary.

### Light-mode default

- **ALT-003**: **Description**: Ship light first.
- **ALT-004**: **Rejection Reason**: Contradicts the documented dark-default intent
  for a dense, long-session CMS.

## Implementation Notes

- **IMP-001**: `color-scheme: dark` set in
  `packages/ui/src/styles/globals.css`; no light token block authored.
- **IMP-002**: Light-mode era values are listed as deferred in
  `03-aesthetic-notes.md` alongside the rest of light mode.
- **IMP-003**: A future ADR should record the light-mode token system + toggle when
  built.

## References

- **REF-001**: ADR-0022 (token system this constrains), ADR-0024 (era/type colors
  authored dark-only), ADR-0020 (design system)
- **REF-002**: `packages/ui/src/styles/globals.css`;
  `docs/design/admin/fidelity-2-plan.md`; `docs/design/admin/03-aesthetic-notes.md`
- **REF-003**: `color-scheme` / `prefers-color-scheme` docs

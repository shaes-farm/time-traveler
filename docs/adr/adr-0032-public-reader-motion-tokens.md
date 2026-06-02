---
title: "ADR-0032: Public reader motion-token scale — durations, easing, and reduced-motion contract"
status: "Accepted"
date: "2026-06-02"
authors: "shaes-farm"
tags: ["design-system", "public-reader", "motion", "accessibility", "tokens"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0032: Public reader motion-token scale — durations, easing, and reduced-motion contract

## Status

**Accepted**

## Context

[ADR-0031](adr-0031-public-reader-design-divergence.md) established that the public
reader (`apps/reader`) **diverges from the admin in motion** — motion is a deliberate
continuity/orientation system for the reader, not the admin's affordance-only register.
[`01-ux-principles.md`](../design/public/01-ux-principles.md) §6 named **five motion
classes** (`fractal-zoom`, `context-shift`, `cross-fade`, `enter-exit`,
`ambient-presence`) but deliberately deferred the **concrete durations, easing curves,
and per-surface choreography** to the mid-fidelity spec (#172). The interaction spec
([`05-interaction-specification.md`](../design/public/05-interaction-specification.md)
§13.1) and the wireframes ([`04-wireframes/README.md`](../design/public/04-wireframes/README.md)
gaps table) both list motion timing/easing as a #172-owned open item.

Two facts force a decision rather than ad-hoc values:

1. **There are no motion tokens in the design system today.** [`packages/ui/src/styles/tokens.css`](../../packages/ui/src/styles/tokens.css)
   and `tokens.ts` define color, type, radius, and spacing tokens but **no `--duration-*`
   or `--easing-*` tokens**. Motion in `@repo/ui` today is ad-hoc Tailwind utilities
   (`duration-200`, `duration-300/500` on `sheet`/`dialog`, `duration-150` on `shell`).
   Pinning the reader's motion to free-floating millisecond values would repeat that
   fragmentation across a whole new app.
2. **Motion is an accessibility surface.** ADR-0031 NEG-003 calls out that the reader's
   richer motion adds a reduced-motion obligation the admin never had. A reusable scale
   with a single, global reduced-motion collapse rule is the safest way to guarantee
   every animated surface honors `prefers-reduced-motion: reduce` consistently.

The PRD requires "smooth transitions when zooming" (§2.2.3, §3.2.5); the reader must
deliver that **within** the [ADR-0024](adr-0024-accessibility-first-visual-language.md)
motion anti-patterns (no scroll-driven animation, no parallax, no custom cursors, no
magnetic buttons), which remain binding.

## Decision

Adopt a **named motion-token scale** for the public reader — a small set of duration
and easing tokens — and **bind each of the five motion classes** to tokens from that
scale, governed by a single global reduced-motion collapse rule. The concrete token
values and the per-class / per-surface choreography are specified in
[`docs/design/public/06-mid-fidelity/motion-spec.md`](../design/public/06-mid-fidelity/motion-spec.md);
this ADR records the **rule** (that a token scale exists, what it covers, and the
reduced-motion contract), not the styling detail.

**Duration scale** (semantic steps, not free values):

| Token                   | Value   | Intent                                                            |
| ----------------------- | ------- | ----------------------------------------------------------------- |
| `--duration-instant`    | `0ms`   | Reduced-motion target; immediate state swap.                      |
| `--duration-fast`       | `120ms` | Micro-feedback: hover, focus, small control state changes.        |
| `--duration-base`       | `200ms` | Default content swap: `cross-fade`, list/facet updates.           |
| `--duration-slow`       | `320ms` | Overlay entrance/exit; lateral `context-shift`.                   |
| `--duration-deliberate` | `480ms` | `fractal-zoom` camera flight only — the one "spatial" transition. |

**Easing scale:**

| Token               | Curve                        | Intent                                     |
| ------------------- | ---------------------------- | ------------------------------------------ |
| `--ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)` | Default; in-and-out moves, `fractal-zoom`. |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0, 1)`   | Entrances (enter half of `enter-exit`).    |
| `--ease-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | Exits (exit half of `enter-exit`).         |

**Binding (class → tokens):** `fractal-zoom` = `deliberate` + `standard`;
`context-shift` = `slow` + `standard`; `cross-fade` = `base` + `standard`;
`enter-exit` = `slow` in/`fast` out + `decelerate`/`accelerate`; `ambient-presence` =
no movement token (opacity-only ≤ `base`, never translation).

**Reduced-motion contract (binding):** when `prefers-reduced-motion: reduce` is
reported, **every** class resolves its duration token to `--duration-instant` (0ms) and
performs no translation/scale interpolation — a direct state swap. `ambient-presence`
drops all motion (static state change only). No content or wayfinding may depend on the
animated path; orientation (the zoom-stack breadcrumb) is always present statically.
This restates ADR-0031 IMP-003 as a token-level rule.

**Scope boundary.** This ADR + the motion spec define the **values and bindings**. The
**CSS-variable implementation** in `@repo/ui` (`tokens.ts`/`tokens.css` additions and
any `prefers-reduced-motion` utility) is a **downstream implementation ticket**, not part
of #172. Until those tokens ship, the values here are the authoritative reference the
renderer tickets (#65–#69) and `apps/reader` code consume.

## Consequences

### Positive

- **POS-001**: One motion source of truth. The reader's five motion classes map to a
  shared scale instead of scattered millisecond literals, matching how color/type/radius
  are already tokenized (ADR-0022).
- **POS-002**: Reduced-motion is guaranteed uniformly. A single collapse rule on the
  duration token means no surface can accidentally ship un-reduced motion.
- **POS-003**: The renderer tickets (#65–#69) get concrete, citable timing for the
  smooth-zoom requirement (PRD §2.2.3) without re-deriving values per surface.
- **POS-004**: The token scale is reusable by the admin later if it ever wants to retire
  its ad-hoc Tailwind durations — without forcing that migration now.

### Negative

- **NEG-001**: Introduces a new token family the design system must maintain in sync
  (`tokens.ts` ↔ `tokens.css`), like the existing color tokens.
- **NEG-002**: The reader's existing `@repo/ui` primitives (`sheet`, `dialog`) currently
  use hard-coded Tailwind durations; aligning them to the scale is follow-up work, not
  done here.
- **NEG-003**: The specific values (120/200/320/480ms, the easing curves) are a design
  judgment validated at mid-fidelity, not yet motion-tested in a prototype (#173 may
  tune them).

## Alternatives Considered

### Option A (rejected) — Keep motion values inline in the spec, no tokens

- **ALT-001**: **Description**: Document durations/easing only inside `06-mid-fidelity`,
  with no token scale or ADR.
- **ALT-002**: **Rejection reason**: A cross-cutting, precedent-setting design-system
  rule (CLAUDE.md "When to write an ADR") would go unrecorded; the reader and any future
  consumer would copy literal millisecond values, re-fragmenting motion exactly as the
  ad-hoc Tailwind durations already do.

### Option B (rejected) — Implement the motion CSS tokens now as part of #172

- **ALT-003**: **Description**: Add `--duration-*`/`--ease-*` to `tokens.ts`/`tokens.css`
  and refactor `@repo/ui` primitives within this issue.
- **ALT-004**: **Rejection reason**: #172 is explicitly a **design artifact** issue —
  "Final production component implementation" is out of scope. Token implementation
  belongs to a downstream ticket so it lands with `apps/reader` code and primitive
  alignment, reviewed as code, not as a spec.

## Implementation Notes

- **IMP-001**: A downstream ticket adds `--duration-instant|fast|base|slow|deliberate`
  and `--ease-standard|decelerate|accelerate` to `tokens.ts` (source of truth) and
  hand-syncs `tokens.css`, mirroring the existing dual-source pattern (ADR-0022).
- **IMP-002**: The same ticket should add a global `@media (prefers-reduced-motion: reduce)`
  rule that resolves all duration tokens to `0ms`, so the collapse is enforced once, not
  per component.
- **IMP-003**: `fractal-zoom` (#65/#68) is the only class that interpolates a viewport
  transform; it MUST remain **interruptible** (a re-zoom mid-flight is never blocked) per
  [05](../design/public/05-interaction-specification.md) §10.3 and the motion spec.
- **IMP-004**: Existing `@repo/ui` `sheet`/`dialog`/`shell` durations may be re-pointed at
  the new tokens opportunistically; not required by this ADR.

## References

- **REF-001**: [ADR-0031](adr-0031-public-reader-design-divergence.md) — public reader
  design divergence; this ADR makes its "divergent motion" concrete (builds on, does not
  supersede).
- **REF-002**: [ADR-0024](adr-0024-accessibility-first-visual-language.md) — motion
  anti-patterns, binding on the reader.
- **REF-003**: [ADR-0022](adr-0022-design-tokens-dual-source.md) — dual-source token
  pattern (`tokens.ts` ↔ `tokens.css`) the motion tokens follow.
- **REF-004**: [ADR-0023](adr-0023-dark-mode-only-fidelity-2.md) — dark-mode-only,
  inherited by the reader.
- **REF-005**: [`docs/design/public/01-ux-principles.md`](../design/public/01-ux-principles.md)
  §6 — the five motion classes this ADR pins.
- **REF-006**: [`docs/design/public/06-mid-fidelity/motion-spec.md`](../design/public/06-mid-fidelity/motion-spec.md)
  — the concrete per-class/per-surface choreography governed by this scale.
- **REF-007**: [Issue #172](https://github.com/shaes-farm/time-traveler/issues/172) —
  public reader mid-fidelity + motion + accessibility spec.
- **REF-008**: [Epic #165](https://github.com/shaes-farm/time-traveler/issues/165) —
  public reader UX design artifacts.

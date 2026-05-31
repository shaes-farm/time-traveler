---
title: "ADR-0031: Public reader design divergence — shared tokens, divergent motion + composition"
status: "Accepted"
date: "2026-05-31"
authors: "shaes-farm"
tags:
  [
    "design-system",
    "public-reader",
    "visual-language",
    "motion",
    "accessibility",
    "tokens",
  ]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0031: Public reader design divergence — shared tokens, divergent motion + composition

## Status

**Accepted**

## Context

The project now has two distinct UI surfaces:

- **`apps/admin`** — a dense, keyboard-first authoring CMS in the Notion / Linear / Sanity
  register. Its finalized visual language (era palette, character-type identity, significance
  ramp, uncertainty treatment, dark-mode-only) lives in
  [`docs/design/admin/03-aesthetic-notes.md`](../design/admin/03-aesthetic-notes.md) and is
  carried by the OKLCH token files in `@repo/ui`.
- **`apps/reader`** — the anonymous, read-only public reader ([ADR-0030](adr-0030-public-reader-app-placement.md)),
  an immersive, exploratory consumption surface for published temporal content (PRD §2.2).

The reader IA ([`docs/design/public/00-ia-route-model.md`](../design/public/00-ia-route-model.md)
§1 principle 5) and the admin aesthetic notes (_What would change my mind_) both anticipate that
these two surfaces will **share design tokens but diverge sharply in motion and composition**.
Issue #167 (public UX principles + visual direction) makes that divergence concrete and needs a
load-bearing, precedent-setting rule recorded: which parts of the design system are a shared
source of truth, and which parts the reader is free to — and expected to — diverge on.

Without an explicit policy, two failure modes are likely: (1) the reader forks the palette or
type system, fragmenting the design system and breaking token consistency; or (2) the reader is
held to the admin's affordance-only motion and table-dense composition, defeating the immersive
experience the PRD calls for.

## Decision

The public reader **reuses the shared design system as a single source of truth and diverges
only in composition and motion**. Concretely:

- **Shared (single source of truth, consumed not forked):** all color tokens
  (`--color-era-*`, `--color-importance-*`, foreground/background/muted, and the reserved
  `--color-type-*` slots once the type-badge primitive ships),
  the typeface set (Fraunces display / Inter Tight body / JetBrains Mono mono), spacing and
  radius tokens, the lucide-react icon set, and shadcn/ui primitives — all from `@repo/ui`
  (ADR-0020, ADR-0022, ADR-0025). The canonical values live in
  [`packages/ui/src/styles/tokens.ts`](../../packages/ui/src/styles/tokens.ts) (hand-synced to
  `tokens.css`); design docs cite them, never redefine them.
- **Divergent (reader-owned):** composition (spacious, editorial, single dominant column vs.
  the admin's multi-rail table density), information density (resolves progressively with zoom
  depth vs. always-dense), display-type scale (larger for immersion), and **motion** (a
  deliberate continuity/orientation system vs. the admin's affordance-only motion).
- **Never shared:** the navigation shell. The reader and admin are separate Next.js apps
  ([ADR-0030](adr-0030-public-reader-app-placement.md)) with separate chrome.

The accessibility-first constraints of [ADR-0024](adr-0024-accessibility-first-visual-language.md)
remain **binding on both surfaces**: hue is never the only signal, the era code always renders,
character type is icon + tint + label, and the motion anti-patterns (no scroll-driven animation,
custom cursors, parallax, magnetic buttons) hold. The reader's richer motion operates **within**
these bounds and additionally honors `prefers-reduced-motion`. Dark-mode-only
([ADR-0023](adr-0023-dark-mode-only-fidelity-2.md)) also applies to the reader for the current
fidelity phase.

The detailed expression of this decision — UX principles, do/don't patterns, motion classes, and
the accessibility baseline — is documented in
[`docs/design/public/01-ux-principles.md`](../design/public/01-ux-principles.md).

## Consequences

### Positive

- **POS-001**: One design-system source of truth. The reader and admin stay visually coherent at
  the token level even as their compositions diverge; a token change propagates to both.
- **POS-002**: The reader is free to deliver the immersive, editorial, motion-aware experience the
  PRD (§2.2.1–2.2.3 exploration, §2.2.7 narrative reading) requires, without being constrained by
  the admin's density-first register.
- **POS-003**: Accessibility guarantees are uniform. Because ADR-0024 binds both surfaces, a reader
  built on shared tokens inherits colorblind-safe eras and never-color-only signals for free.
- **POS-004**: Clear guidance for downstream wireframe/fidelity issues (#168–#173): reuse tokens,
  diverge in layout and motion, file an ADR before forking anything shared.

### Negative

- **NEG-001**: The reader cannot unilaterally adopt a new palette, typeface, or light theme; any
  such change requires a new ADR (e.g. a reader light/reading mode would amend ADR-0023). This is
  intentional friction.
- **NEG-002**: "Diverge in composition and motion, share everything else" is a judgment boundary,
  not a mechanical rule; some cases (e.g. a reader-only surface treatment) will need adjudication
  against this ADR rather than being obvious.
- **NEG-003**: Richer reader motion adds an accessibility surface area (reduced-motion handling)
  that the admin's affordance-only motion did not require; #172 must specify it per-surface.

## Alternatives Considered

### Option A (rejected) — Fully independent reader design system

- **ALT-001**: **Description**: Give the reader its own palette, type system, and component
  styling, optimized purely for immersion, with no shared token contract.
- **ALT-002**: **Rejection reason**: Fragments the design system, duplicates maintenance, and
  risks diverging the colorblind-safe era encoding that ADR-0024 makes load-bearing. Token drift
  between surfaces would be inevitable.

### Option B (rejected) — Reader held to the admin visual + motion register

- **ALT-003**: **Description**: Apply the admin's density-first composition and affordance-only
  motion directly to the reader for maximum consistency.
- **ALT-004**: **Rejection reason**: Defeats the reader's purpose. The PRD calls for immersive
  exploration and narrative reading with smooth zoom transitions (§2.2.2–2.2.3, §3.2.5); the
  admin register actively fights that.

## Implementation Notes

- **IMP-001**: `apps/reader` consumes `@repo/ui` tokens and primitives; it must not declare its
  own color/type tokens. Reader-specific styling is composition (layout, spacing application,
  type-scale selection) over the shared tokens, not new token declarations.
- **IMP-002**: Motion is specified as **classes** in
  [`01-ux-principles.md`](../design/public/01-ux-principles.md) §6 (`fractal-zoom`,
  `context-shift`, `cross-fade`, `enter-exit`, `ambient-presence`); the concrete durations,
  easing curves, and per-surface choreography are owned by the mid-fidelity + motion +
  accessibility spec (#172).
- **IMP-003**: Reduced-motion is a hard requirement: every motion class collapses to an instant
  or near-instant state change under `prefers-reduced-motion: reduce`, and no content or
  wayfinding may depend on the animated path (orientation is always present statically).
- **IMP-004**: Any future desire to fork a shared element (a reader-only typeface, a light reading
  theme, a reader-specific palette) requires a new ADR amending the relevant decision
  (ADR-0022 / ADR-0023 / ADR-0024) — it is not a local styling choice.

## References

- **REF-001**: [ADR-0020](adr-0020-ui-package-shadcn-tailwind.md) — `@repo/ui` design system and
  shared shadcn/ui primitives.
- **REF-002**: [ADR-0022](adr-0022-design-tokens-dual-source.md) — OKLCH dual-source tokens;
  `tokens.ts`/`tokens.css` as canonical source of truth.
- **REF-003**: [ADR-0023](adr-0023-dark-mode-only-fidelity-2.md) — dark-mode-only commitment,
  inherited by the reader.
- **REF-004**: [ADR-0024](adr-0024-accessibility-first-visual-language.md) — accessibility-first
  visual language and motion anti-patterns, binding on both surfaces.
- **REF-005**: [ADR-0025](adr-0025-shared-mediapicker-bespoke-tree.md) — primitive sourcing;
  reuse shadcn, hand-build only genuinely bespoke needs.
- **REF-006**: [ADR-0030](adr-0030-public-reader-app-placement.md) — dedicated `apps/reader`;
  the two surfaces never share a navigation shell.
- **REF-007**: [`docs/design/public/01-ux-principles.md`](../design/public/01-ux-principles.md)
  — the detailed UX principles + visual direction this ADR records.
- **REF-008**: [`docs/design/admin/03-aesthetic-notes.md`](../design/admin/03-aesthetic-notes.md)
  — admin visual language and the _What would change my mind_ note anticipating this divergence.
- **REF-009**: [Issue #167](https://github.com/shaes-farm/time-traveler/issues/167) — Public
  reader UX principles + visual direction.
- **REF-010**: [Epic #165](https://github.com/shaes-farm/time-traveler/issues/165) — Public
  reader UX design artifacts.

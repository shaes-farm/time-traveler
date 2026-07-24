---
title: "ADR-0039: Reader timeline renderer — D3 submodules as a math/behavior engine, React owns the SVG DOM"
status: "Accepted"
date: "2026-07-21"
authors: "Time Traveler engineering"
tags: ["architecture", "decision", "frontend", "reader", "visualization"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0039: Reader timeline renderer — D3 submodules as a math/behavior engine, React owns the SVG DOM

## Status

**Accepted** — first implemented in #65 (the foundation timeline renderer in
`packages/ui/src/components/timeline/`). Ratifies and scopes the rendering-library
choice for the whole Phase-7 visualization chain (#65 renderer, #66 log scale,
#67 linear scale + toggle, #68 fractal zoom, #69 overlays).

## Context

PRD §7.6 (`docs/prd/PRD-0001-time-traveler-system.md` §5479–5499) selects **D3.js
with SVG** as the reader's timeline rendering approach and names the specific
submodules `d3-scale`, `d3-axis`, `d3-zoom`, `d3-selection`, with a Canvas
fallback + virtualization beyond 5000 events (§5488–5492). That choice was never
elevated to an ADR, even though adopting a visualization library is exactly the
"new dependency, cross-cutting, precedent-setting" case CLAUDE.md says warrants one.

The load-bearing risk is _how_ D3 is adopted, not _whether_. D3's `d3-selection`
is an imperative enter/update/exit DOM engine that competes with React for
ownership of the DOM — the classic React↔D3 conflict (double renders, effect
churn, untestable components). Meanwhile the genuinely valuable parts for this
work are **`d3-scale`** (log + linear scales over a 13.8-billion-year domain, with
`.invert()` for pointer→time mapping) and **`d3-zoom`** (cross-input gesture
normalization for #68) — both pure math/behavior, independent of any draw surface.

The accessibility spec (`docs/design/public/06-mid-fidelity/accessibility-spec.md`)
requires focusable markers, real ARIA, a live region, and reduced-motion — all far
cheaper on a React-owned SVG tree than on an opaque `<canvas>` or a D3-manipulated
DOM.

## Decision

Adopt D3 **surgically**, as a **math and behavior engine only**:

- Depend on **individual D3 submodules** (`d3-scale` now; `d3-zoom`/`d3-axis` as
  #66/#68 need them) — **never** the `d3` meta-package.
- **React owns the SVG DOM.** Markers, bands, lanes, and axes are rendered as JSX
  from React state; D3 computes positions/ticks/transforms.
- **`d3-selection` is not used as a rendering engine.** Its only sanctioned use is
  attaching the `d3-zoom` behavior to a container ref (`select(node).call(zoom)`)
  when #68 lands — never to draw content.
- Positioning math lives in a **pure, renderer-agnostic** module
  (`timeline-scale.ts`): the log axis maps signed sortable-years onto
  years-before-present (clamped ≥1) so `scaleLog` has a strictly-positive domain;
  linear maps signed sort-years directly. Domain values come from the
  `sort_order_years` contract / `TemporalService.toSortableYears` — era conversion
  is never re-derived in the renderer.
- **SVG is primary.** The PRD's Canvas fallback (>5000 events) is deferred; because
  the scale math is renderer-agnostic, a future Canvas path reuses it unchanged.
- Motion consumes the `@repo/ui` motion tokens/classes (ADR-0032); no hard-coded
  durations. Reduced-motion is enforced at the token layer.

## Consequences

### Positive

- **POS-001**: Captures D3's real value (`d3-scale` `.invert()`, robust `d3-zoom`
  gestures) while avoiding the React↔D3 DOM-ownership conflict — the renderer stays
  ordinary, testable React.
- **POS-002**: React-owned SVG keeps focus, ARIA, and the live region native,
  directly satisfying the accessibility baseline (ADR-0024, accessibility-spec).
- **POS-003**: Renderer-agnostic scale math makes the future Canvas/virtualized
  fallback (PRD §5488) and the #66–#69 layers cheap, incremental additions.
- **POS-004**: Submodule-only deps keep the bundle small and tree-shakeable.

### Negative

- **NEG-001**: A deliberate, documented divergence from the PRD's literal wording,
  which lists `d3-selection` among the libraries — here constrained to zoom-attach
  only. Reviewers must enforce "no d3-selection rendering."
- **NEG-002**: SVG-with-one-node-per-marker does not scale to the >5000-event case;
  a second (Canvas) render path is still owed later, gated behind virtualization.
- **NEG-003**: The team owns all accessibility and interaction wiring (D3 provides
  none) — an intentional cost of the chosen substrate.

## Alternatives Considered

### Full D3 (`d3` meta-package, `d3-selection`-driven rendering)

- **ALT-001**: **Description**: Let D3 own the SVG via enter/update/exit, per the
  PRD's literal library list.
- **ALT-002**: **Rejection Reason**: Conflicts with React for DOM ownership; harder
  to test, larger bundle, weaker a11y ergonomics. The value is in the math modules,
  not the selection engine.

### Hand-rolled scales/gestures (extend `EraTimelineStrip`'s `log10` approach)

- **ALT-003**: **Description**: Keep bespoke `Math.log10` positioning; write custom
  wheel/pinch/drag handling.
- **ALT-004**: **Rejection Reason**: No `.invert()` without reinventing it, and
  reimplementing `d3-zoom`'s cross-device gesture normalization is costly and
  bug-prone. `d3-scale`/`d3-zoom` are the parts worth buying.

### React wrapper library (visx) or high-level charts (Recharts/nivo/victory)

- **ALT-005**: **Description**: Use visx (React wrappers over d3-scale/shape) or a
  charting library.
- **ALT-006**: **Rejection Reason**: visx still needs `d3-zoom` for gestures and
  adds abstraction without removing the hard part; high-level chart libs target
  bar/line/pie, not a custom zoomable fractal temporal canvas with bands, character
  lanes, and clustering.

## Implementation Notes

- **IMP-001**: Foundation lives in `packages/ui/src/components/timeline/`
  (`timeline-scale.ts`, `timeline-renderer.tsx`, `types.ts`), following the
  `EraTimelineStrip` precedent (reader viz in `@repo/ui`, where the Vitest/coverage
  gate and era/motion tokens are). #65's "in the app" wording is flagged in-code;
  a thin mount in `apps/reader` is deferred to page ticket #261.
- **IMP-002**: Marker hover (`onMarkerHover`) and activate (`onMarkerActivate`) are
  the stable downstream contract consumed by #66–#69 and #261.
- **IMP-003**: Performance baseline method + numbers documented in
  `packages/ui/src/components/timeline/timeline-renderer.perf.md`; virtualization,
  semantic-level culling, and the Canvas fallback are tracked in #66/#68 and a
  future fallback ticket.

## References

- **REF-001**: PRD §7.6 (`docs/prd/PRD-0001-time-traveler-system.md` §5479–5499);
  ADR-0030 (reader app placement); ADR-0031 (reader design divergence); ADR-0032
  (motion tokens); ADR-0024 (accessibility-first visual language).
- **REF-002**: `docs/design/public/05-interaction-specification.md`;
  `docs/design/public/06-mid-fidelity/accessibility-spec.md`;
  `docs/design/public/06-mid-fidelity/implementation-risks.md` (R-65b).
- **REF-003**: D3 modules `d3-scale`, `d3-zoom`, `d3-axis`; issue #65 and epic #270.

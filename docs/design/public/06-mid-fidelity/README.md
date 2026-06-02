# Public Reader — Mid-Fidelity + Motion + Accessibility Spec

Status: **draft 1** — mid-fidelity comps (token/type/spacing callouts + component states), the motion system, and the accessibility annotation set for the public reader surface.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#172](https://github.com/shaes-farm/time-traveler/issues/172)
Builds on: [00 — IA + route model](../00-ia-route-model.md) · [01 — UX principles](../01-ux-principles.md) · [02 — Screen inventory](../02-screen-inventory.md) · [03 — User flows](../03-user-flows.md) · [04 — Wireframes](../04-wireframes/) · [05 — Interaction spec](../05-interaction-specification.md)

> **What this artifact is.** The mid-fidelity design package for the public reader (artifact **06** in the [#165](https://github.com/shaes-farm/time-traveler/issues/165) chain). It upgrades the low-fi wireframes ([04](../04-wireframes/)) to mid-fidelity by fixing the **visual hierarchy, token application, component states, motion timing, and accessibility annotations** for every screen — sufficient for engineering estimation and ticket slicing on the timeline-visualization tickets ([#65–#69](https://github.com/shaes-farm/time-traveler/issues/65)).
>
> **What this artifact is not.** Not Figma comps (the repo has no design tool; all artifacts are markdown — see [decision below](#format-no-figma)), not production component code (out of scope per #172; `apps/reader` is unbuilt, [ADR-0030](../../../adr/adr-0030-public-reader-app-placement.md)), not new design tokens (it **cites** [tokens.css](../../../../packages/ui/src/styles/tokens.css), never redefines — [ADR-0031](../../../adr/adr-0031-public-reader-design-divergence.md)), and not the interaction state machine ([#171](https://github.com/shaes-farm/time-traveler/issues/171), [05](../05-interaction-specification.md)).

## Format (no Figma)

This package is **markdown spec docs**, matching the 00–05 convention. ASCII frames from [04](../04-wireframes/) are the structural base; each screen doc adds the mid-fidelity layer (token callouts, states, motion, a11y) rather than re-drawing pixels. Component implementation is explicitly out of scope for #172.

## Contents

| File                                                                    | Purpose                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [motion-spec.md](motion-spec.md)                                        | Motion-token values, per-class choreography, stale-banner, reduced-motion  |
| [accessibility-spec.md](accessibility-spec.md)                          | Keyboard map, focus model, contrast matrix, SR verbosity, color-only audit |
| [implementation-risks.md](implementation-risks.md)                      | Open implementation risks sliced per engineering ticket (#65–#69)          |
| [00-app-shell.md](00-app-shell.md) … [11-not-found.md](11-not-found.md) | Per-screen mid-fi comps (12 screens)                                       |

### Screen index

| #   | Screen                                         | Route                         | MVP status                 |
| --- | ---------------------------------------------- | ----------------------------- | -------------------------- |
| 00  | [App shell](00-app-shell.md)                   | _wraps all routes_            | **MVP**                    |
| 01  | [Landing / discovery](01-landing.md)           | `/`                           | **MVP**                    |
| 02  | [Explore (timeline navigator)](02-explore.md)  | `/explore`                    | **MVP**                    |
| 03  | [Timeline reader](03-timeline-reader.md)       | `/:username/timelines/:slug`  | **MVP**                    |
| 04  | [Story browser](04-story-browser.md)           | `/stories`                    | **MVP**                    |
| 05  | [Story reader](05-story-reader.md)             | `/:username/stories/:slug`    | **MVP**                    |
| 06  | [Event detail](06-event-detail.md)             | `/:username/events/:slug`     | **MVP**                    |
| 07  | [Character profile](07-character-profile.md)   | `/:username/characters/:slug` | **MVP**                    |
| 08  | [Period detail](08-period-detail.md)           | `/:username/periods/:slug`    | **MVP**                    |
| 09  | [Comparative viewer](09-comparative-viewer.md) | `/compare`                    | **MVP-optional** (stretch) |
| 10  | [Global search](10-search.md)                  | `/search`                     | **Post-MVP / stubbed**     |
| 11  | [Not found](11-not-found.md)                   | `404`                         | **MVP**                    |

Per the user decision for #172, **all 12 screens** receive a mid-fi comp — including the MVP-optional comparative viewer (09) and the stubbed search (10, comp'd at stub fidelity only).

---

## Reader visual-system reference

The shared composition values the screen docs cite. These are **applications of the locked tokens** ([tokens.css](../../../../packages/ui/src/styles/tokens.css)), not new tokens — the reader is free to diverge in composition and type-scale ([ADR-0031](../../../adr/adr-0031-public-reader-design-divergence.md)); it is not free to fork color/type/radius tokens.

### Type scale (composition over `--font-display` / `--font-body` / `--font-mono`)

| Role       | Family (`--font-*`)     | Size / line-height      | Used for                                              |
| ---------- | ----------------------- | ----------------------- | ----------------------------------------------------- |
| Display XL | `display` (Fraunces)    | ~3rem / 1.1             | Landing + story hero `h1`                             |
| Display L  | `display` (Fraunces)    | ~2.25rem / 1.15         | Screen `h1`, section titles                           |
| Display M  | `display` (Fraunces)    | ~1.5rem / 1.2           | Card titles, sub-headings                             |
| Body L     | `body` (Inter Tight)    | 1.125rem / 1.7, 60–75ch | **Prose** (story reader); comfortable reading measure |
| Body M     | `body` (Inter Tight)    | 1rem / 1.5              | Default UI text, list rows                            |
| Body S     | `body` (Inter Tight)    | 0.875rem / 1.4          | Captions, qualifiers, meta                            |
| Mono       | `mono` (JetBrains Mono) | 0.875rem, tabular       | Era codes, slugs, IDs, axis year labels (tabular)     |

The reader **leans to the upper end** for display type (immersion) and constrains prose measure to 60–75ch ([01 §4.2/§5](../01-ux-principles.md)); the admin stays compact.

### Spacing + surfaces

- **Spacing rhythm:** 4px base unit; section gaps 2rem (desktop) / 1.5rem (mobile); generous side gutters (one dominant column, [01 §4.2](../01-ux-principles.md)).
- **Layout widths:** reading column max ~70ch; canvas/content max ~1200px ([04 app-shell](../04-wireframes/00-app-shell.md)).
- **Surface levels:** `--color-background` (zinc-950) shell · `--color-surface` (zinc-900) cards/panels/popovers · `--color-surface-2` (zinc-800) hover/active/muted insets. Lines: `--color-border` / `--color-border-muted`.
- **Radius:** `--radius-sm` chips/inputs · `--radius-md` cards/panels · `--radius-lg` overlays/sheets.

### Standard component states (applied per screen)

Every interactive module specifies these where applicable: **default · hover** (`--color-surface-2` wash) **· focus-visible** (`--color-ring`, always visible, [05 §10.1](../05-interaction-specification.md)) **· active/pressed · disabled** (reduced opacity, `aria-disabled`) **· selected** (`aria-selected` + accent ring). Each screen doc tabulates the ones it uses.

---

## Resolved #172-owned items

Items the upstream artifacts deferred to #172, and where they are now closed:

| Deferred item                                               | Closed in                                                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Motion durations / easing / per-surface choreography        | [motion-spec.md](motion-spec.md) §1–§2 + [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) |
| Stale-content (`ambient-presence`) banner copy/placement    | [motion-spec.md](motion-spec.md) §3                                                                       |
| Comparative-viewer shared-event indicator + track-limit     | [09-comparative-viewer.md](09-comparative-viewer.md)                                                      |
| Cluster-panel pagination UX                                 | [03-timeline-reader.md](03-timeline-reader.md) + [accessibility-spec.md](accessibility-spec.md) §4.2      |
| Screen-reader verbosity for high-frequency zoom             | [accessibility-spec.md](accessibility-spec.md) §4.1                                                       |
| Per-screen a11y annotations (focus/contrast/reduced-motion) | each screen doc's _Accessibility_ section + [accessibility-spec.md](accessibility-spec.md)                |
| Live-dot visual treatment + reduced-motion fallback         | [00-app-shell.md](00-app-shell.md) + [motion-spec.md](motion-spec.md) §2.5/§5                             |

---

## Handoff

| Issue                                                            | Consumes from this package                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#173](https://github.com/shaes-farm/time-traveler/issues/173)   | The MVP-floor comps + motion + a11y as the prototype-validation surfaces.                                                                                                                                                                                                       |
| [#65–#69](https://github.com/shaes-farm/time-traveler/issues/65) | [implementation-risks.md](implementation-risks.md) per-ticket risks; [03](03-timeline-reader.md)/[09](09-comparative-viewer.md) renderer surfaces; [motion-spec](motion-spec.md) `fractal-zoom` timing; [accessibility-spec](accessibility-spec.md) canvas keyboard + SR rules. |

Gating ([00 §6](../00-ia-route-model.md), #165): #65–#67 unblock on the interaction spec ([#171](https://github.com/shaes-farm/time-traveler/issues/171)) + this spec (#172); #68–#69 additionally require prototype validation ([#173](https://github.com/shaes-farm/time-traveler/issues/173)).

---

## Verification (issue #172 acceptance criteria)

- [x] **Mid-fidelity comps cover all critical journey screens** — all 12 screen docs ([00](00-app-shell.md)–[11](11-not-found.md)); MVP floor 00–08 + 11 at full fidelity, 09 full, 10 at stub fidelity.
- [x] **Motion behavior documented with timing/intent** — [motion-spec.md](motion-spec.md) (token values, per-class choreography, per-screen matrix) + [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md).
- [x] **Accessibility annotations included per screen/flow** — each screen doc's _Accessibility_ table + [accessibility-spec.md](accessibility-spec.md) (keyboard, focus, contrast, SR verbosity, color-only audit); flow variants in [03](../03-user-flows.md).
- [x] **Design decisions traceable to IA/flow/interaction artifacts** — every doc's _Builds on_ header + inline cites to [00](../00-ia-route-model.md)/[01](../01-ux-principles.md)/[02](../02-screen-inventory.md)/[03](../03-user-flows.md)/[04](../04-wireframes/)/[05](../05-interaction-specification.md).
- [x] **Open implementation risks identified for engineering tickets** — [implementation-risks.md](implementation-risks.md).

**Verification checks (from #172):**

- [x] **Sufficient for engineering estimation + ticket slicing** — per-screen states + component states + motion timing + [implementation-risks.md](implementation-risks.md) per-ticket slices.
- [x] **#65–#69 consumable without new UX ambiguity** — the [Resolved #172-owned items](#resolved-172-owned-items) table closes every deferred ambiguity those tickets depended on.

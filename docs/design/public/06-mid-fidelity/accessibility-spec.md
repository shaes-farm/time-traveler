# Public Reader — Accessibility Specification

Status: **draft 1** — cross-screen accessibility annotations: keyboard map, focus-order + restoration model, contrast-intent matrix, screen-reader live-region verbosity, reduced-motion catalog, and never-color-only audit.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#172](https://github.com/shaes-farm/time-traveler/issues/172)
Builds on: [01 — UX principles §7](../01-ux-principles.md) · [05 — Interaction spec §4/§10](../05-interaction-specification.md) · [03 — User flows, accessibility summary](../03-user-flows.md) · [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md) (accessibility-first visual language) · [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) (reduced-motion contract)

> **What this document is.** The cross-screen accessibility contract for the public reader: a consolidated keyboard map, the focus-order + focus-restoration model, the WCAG 2.1 AA contrast-intent matrix over the shared tokens, screen-reader live-region verbosity rules (including the high-frequency zoom-announcement tuning deferred to #172), the reduced-motion catalog, and a never-color-only audit across all 12 screens. It is the floor that [01 §7](../01-ux-principles.md) set; this turns it into per-surface detail and **closes** the SR-verbosity item from [05 §13.4](../05-interaction-specification.md).
>
> **What this document is not.** Not an audit of shipped code (no `apps/reader` yet), not new color values (it cites [tokens.css](../../../../packages/ui/src/styles/tokens.css), never redefines), and not the per-screen focus-order tables — those live in each screen doc. This is the shared model those tables instantiate.

---

## 1. Keyboard map (consolidated)

Consolidates the canvas key bindings from [05 §4.1](../05-interaction-specification.md) and the traversal contract from [05 §10](../05-interaction-specification.md). Global keys work on every screen; canvas keys require canvas focus.

### 1.1 Global (all screens)

| Key                 | Action                                                        |
| ------------------- | ------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Move forward/back through focusable controls in reading order |
| `Enter` / `Space`   | Activate the focused control                                  |
| `Escape`            | Close the highest-priority open overlay/panel/sheet           |
| First `Tab` on load | Reveals **Skip to content** (app-shell, first focusable)      |

### 1.2 Timeline canvas (when canvas has focus — [03](03-timeline-reader.md), [09](09-comparative-viewer.md))

| Key             | Action                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| `=` / `+`       | Step zoom-in around focus anchor ([05 §4.1](../05-interaction-specification.md)) |
| `-`             | Step zoom-out around focus anchor                                                |
| `Arrow` keys    | Pan by a fixed viewport fraction                                                 |
| `Shift+Arrow`   | Pan by a larger viewport fraction                                                |
| `0`             | Reset zoom to timeline-root extent                                               |
| `Enter`/`Space` | Open the focused cluster panel / activate focused event                          |
| `Escape`        | Close cluster panel / popover                                                    |

Keyboard zoom anchor precedence: selected event → keyboard focus target → viewport center ([05 §4.3](../05-interaction-specification.md)). Every pointer/touch outcome (zoom, pan, reset, cluster open, drill-in, breadcrumb jump) has a keyboard equivalent — input parity is required ([05 §10.4](../05-interaction-specification.md)).

---

## 2. Focus order + restoration model

### 2.1 Focus order principle

Focus order **follows reading order** ([01 §7](../01-ux-principles.md)): skip-link → top-nav → (stale banner if present) → main content landmark → footer. Within main content, order follows the visual top-to-bottom, leading-to-trailing layout fixed in each screen's comp. Each screen doc carries a **numbered focus-order table** instantiating this.

### 2.2 Focus restoration on route transition

From [05 §8.4](../05-interaction-specification.md), generalized to all navigations:

- **Primary target:** focus moves to the **main heading (`h1`)** of the destination screen (the main-content landmark is the focus root). _Implementation note:_ a heading is not focusable by default — the `h1` (or the `main` landmark) must be made **programmatically focusable** with `tabindex="-1"` so it can receive focus on navigation without joining the normal Tab order.
- **Secondary target (keyboard-initiated nav only):** if a keyboard activation triggered the navigation (e.g. a breadcrumb jump), focus may instead return to the **control that initiated it** when the reader stays on the same screen type (breadcrumb segment, facet).
- **Overlay dismissal:** closing an overlay returns focus to the trigger that opened it (event popover → the event marker; mobile nav panel → the menu button).
- **`context-shift` / `fractal-zoom`:** focus restoration is independent of motion — it happens at the static end state, so reduced-motion users get identical focus behavior.

### 2.3 Landmarks + skip link

Every screen exposes `banner` (app-shell nav), `main` (content), `contentinfo` (footer), and `navigation` for the top nav + the zoom-stack breadcrumb. **Skip to content** is the first focusable element and targets `main` ([00 app-shell](00-app-shell.md); [01 §7](../01-ux-principles.md)).

---

## 3. Contrast-intent matrix (WCAG 2.1 AA)

Intent over the shared tokens ([tokens.css](../../../../packages/ui/src/styles/tokens.css)); the reader **reuses** these and must not place a token as text without meeting the target. AA = 4.5:1 for normal text, 3:1 for large text (≥24px or ≥18.66px bold) and meaningful non-text UI ([01 §7](../01-ux-principles.md); [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md)).

| Foreground token            | On background                            | Role                                                                   | AA target                       |
| --------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| `--color-foreground`        | `--color-background` / `--color-surface` | Primary text, headings                                                 | 4.5:1                           |
| `--color-foreground-muted`  | `--color-background`                     | Qualifiers (`c.`/`~`/`est.`), captions                                 | 4.5:1                           |
| `--color-foreground-subtle` | `--color-surface`                        | Decorative/secondary only — **not** primary text                       | 4.5:1 if textual                |
| `--color-era-*`             | `--color-surface`                        | Era accent on badges; era **code** always renders in mono beside value | 3:1 (non-text) + redundant text |
| `--color-importance-*`      | `--color-surface`                        | Significance ramp on markers; paired with ★/label                      | 3:1 (non-text) + redundant text |
| `--color-ring`              | any surface                              | Focus indicator — always visible, never suppressed                     | 3:1                             |
| `--color-destructive`       | `--color-surface`                        | Error region accent; paired with text                                  | 4.5:1 text                      |

**Rules:** (1) low-chroma era/type tints are validated as **badge fills**, not as text color, before use; (2) primary content is never rendered in `--color-foreground-muted` "for subtlety" ([01 §5](../01-ux-principles.md) contrast do/don't); (3) the focus ring (`--color-ring`) meets 3:1 against every surface it can land on and is never removed for pointer users ([05 §10.1](../05-interaction-specification.md)).

---

## 4. Screen-reader live-region verbosity

Closes the "screen-reader verbosity tuning for high-frequency zoom updates" item deferred to #172 ([05 §13.4](../05-interaction-specification.md)). All live regions are `aria-live="polite"` (never `assertive` — the reader is exploratory, not alerting).

### 4.1 Canvas zoom / scale announcements ([03](03-timeline-reader.md), [09](09-comparative-viewer.md))

High-frequency zoom input (wheel/pinch) would flood a screen reader if every transform frame announced. Rules:

- **Coalesce + debounce:** announce only the **settled** state, debounced **500ms** after the last zoom input — never mid-gesture, never per frame.
- **Announce semantic level, not raw scalar:** e.g. _"Zoomed to period/event detail · showing ~538–485 MYA"_ — the semantic level (L0–L3, [05 §6](../05-interaction-specification.md)) + the visible temporal window, not `viewportZoom=12.4`.
- **Scale toggle** announces immediately (it is a discrete, intentional action): _"Linear scale"_ / _"Logarithmic scale"_.
- **Reset** announces _"Zoom reset to <timeline> root"_.
- **Continuous zoom while a prior announcement is queued** replaces the queued message (latest-wins) so the reader never hears a backlog.

### 4.2 Cluster + drill announcements

- Opening a cluster panel announces **count + actions**: _"Cluster, 7 events. List, first 25 shown."_ ([05 §10.2](../05-interaction-specification.md)).
- Drill-in announces the destination: _"Drilled into <sub-timeline>, level <n>."_ Breadcrumb jump announces _"Jumped to <ancestor>, level <n>."_

### 4.3 Ambient / realtime announcements

- The stale-content banner is `aria-live="polite"` and announces once on appearance (_"Live updates paused, reconnecting"_ / _"New updates available"_); it does not re-announce on every retry ([motion-spec §3](motion-spec.md)).

### 4.4 Static media + entity content

- Images announce `alt_text` (required, PRD §4.8.6) ([01 §7](../01-ux-principles.md)).
- Temporal values are read with era + precision (_"approximately 538 million years ago"_) via the `TemporalDisplay` semantics, not the bare number.

---

## 5. Reduced-motion catalog

The per-class reduced-motion behavior is fixed in [motion-spec §5](motion-spec.md) and bound by [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md). Cross-screen guarantees:

- Every screen that fires motion ([motion-spec §6](motion-spec.md) matrix) collapses to instant state changes under `prefers-reduced-motion: reduce`.
- **No wayfinding depends on the animated path** — the zoom-stack breadcrumb, scale indicator, and selection state are all true statically.
- `ambient-presence` drops all motion (static state change) — no pulse/blink on the live dot or banner.
- Enforced once at the token layer, not per component ([ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) IMP-002).

---

## 6. Never-color-only audit (all 12 screens)

Every meaningful signal is redundant with text and/or icon ([ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md); [01 §7](../01-ux-principles.md)):

| Signal                               | Color layer                 | Redundant non-color layer                                                                  |
| ------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------ |
| Era (CE/BCE/KYA/MYA/BYA)             | `--color-era-*`             | Mono **era code** always rendered beside the value                                         |
| Character type (7)                   | `--color-type-*` tint       | Lucide icon + literal type **label**                                                       |
| Significance/importance              | `--color-importance-*` ramp | ★ rating + numeric value                                                                   |
| Published vs. unpublished cross-link | (none)                      | Published = link; unpublished = **inert text** ([00 §5.2 rule 1](../00-ia-route-model.md)) |
| Active scale (log/linear)            | control accent              | Radio label text + `aria-checked` (radio group, not `aria-pressed`)                        |
| Active facets                        | chip accent                 | Chip **label** + remove affordance + result count                                          |
| Selected event/marker                | accent ring                 | `aria-selected` + focus ring + popover                                                     |
| Connection state                     | banner accent               | Banner **text** ([motion-spec §3](motion-spec.md))                                         |

---

## 7. Per-screen accessibility annotation contract

Each of the 12 screen docs ([00](00-app-shell.md)–[11](11-not-found.md)) carries an **Accessibility** section with a numbered table covering: **focus order** (instantiating [§2](#2-focus-order--restoration-model)), **contrast intent** (token pairs from [§3](#3-contrast-intent-matrix-wcag-21-aa)), **reduced-motion behavior** (from [§5](#5-reduced-motion-catalog)), and **landmark/live-region roles** (from [§2.3](#23-landmarks--skip-link) + [§4](#4-screen-reader-live-region-verbosity)). This spec is the shared model; the screen tables are the instances.

---

## 8. Verification (accessibility portion of #172)

- [x] **Accessibility annotations included per screen/flow** — §7 contract + each screen doc's Accessibility table; flow-level variants in [03](../03-user-flows.md) accessibility summary.
- [x] **Focus order documented** — §2 model + per-screen numbered tables.
- [x] **Contrast intent documented** — §3 AA matrix over shared tokens.
- [x] **Motion-reduction behavior documented** — §5 catalog + [motion-spec §5](motion-spec.md).
- [x] **SR verbosity for high-frequency zoom resolved** — §4.1 (closes [05 §13.4](../05-interaction-specification.md)).
- [x] **Never-color-only upheld** — §6 audit across all 12 screens ([ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md)).

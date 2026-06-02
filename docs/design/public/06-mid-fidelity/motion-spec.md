# Public Reader — Motion Specification

Status: **draft 1** — concrete motion-token values, per-class choreography, per-surface application, and the reduced-motion contract.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#172](https://github.com/shaes-farm/time-traveler/issues/172)
Builds on: [01 — UX principles §6](../01-ux-principles.md) · [05 — Interaction spec §10.3](../05-interaction-specification.md) · [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) (motion-token scale) · [ADR-0031](../../../adr/adr-0031-public-reader-design-divergence.md) (motion divergence) · [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md) (motion anti-patterns)

> **What this document is.** The concrete motion system for the public reader: the duration/easing token values (governed by [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md)), the exact timing + easing + choreography for each of the five motion classes named in [01 §6](../01-ux-principles.md), where each class fires per surface, and the binding reduced-motion behavior. It **closes** the motion-timing item deferred to #172 by [01 §6](../01-ux-principles.md), [05 §13.1](../05-interaction-specification.md), and the [04 wireframes gaps table](../04-wireframes/README.md).
>
> **What this document is not.** It is not the CSS-variable implementation (a downstream ticket per [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) scope boundary), not the rendering engine (#65), and not new motion classes — the five classes are fixed by [01 §6](../01-ux-principles.md) and not re-litigated.

---

## 1. Motion-token scale

These are the values fixed by [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md). They are referenced by token name everywhere in the per-screen comps; **values live here and in the ADR, not redefined per screen.**

### 1.1 Durations

| Token                   | Value   | Used for                                                       |
| ----------------------- | ------- | -------------------------------------------------------------- |
| `--duration-instant`    | `0ms`   | Reduced-motion resolution of every class; immediate state swap |
| `--duration-fast`       | `120ms` | Hover / focus / small control feedback; `enter-exit` dismiss   |
| `--duration-base`       | `200ms` | `cross-fade`; facet/list/scale-toggle content swaps            |
| `--duration-slow`       | `320ms` | `context-shift`; overlay/sheet/popover entrance                |
| `--duration-deliberate` | `480ms` | `fractal-zoom` camera flight (the only spatial transition)     |

### 1.2 Easing

| Token               | Curve                        | Used for                                        |
| ------------------- | ---------------------------- | ----------------------------------------------- |
| `--ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)` | Default; `fractal-zoom`, `context-shift`, swaps |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0, 1)`   | Entrances (the "enter" half of `enter-exit`)    |
| `--ease-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | Exits (the "exit" half of `enter-exit`)         |

---

## 2. Per-class choreography

Each class from [01 §6](../01-ux-principles.md) is bound to tokens + a movement description. All five obey the [global motion rules](#4-global-motion-rules) and the [reduced-motion contract](#5-reduced-motion-contract).

### 2.1 `fractal-zoom` — spatial continuity across temporal scale

- **Tokens:** `--duration-deliberate` (480ms) · `--ease-standard`.
- **Choreography:** the viewport transform (scale + translate) interpolates from the origin anchor (the activated event/card position, or the breadcrumb segment's level) to the destination fit. The camera "flies" along the zoom axis; opacity holds (no cross-fade) so the reader perceives one continuous space, not a page swap.
- **Surfaces:** Timeline reader drill-in/out + breadcrumb jump + reset ([03](03-timeline-reader.md)); entering the canvas from a card/cross-link ([01-landing](01-landing.md), [02-explore](02-explore.md), [06-event-detail](06-event-detail.md)); per-track zoom in the comparative viewer ([09](09-comparative-viewer.md)).
- **Interruptibility (required):** a new zoom input mid-flight retargets the transform from its current value — the reader is never blocked waiting for the 480ms to finish ([05 §10.3](../05-interaction-specification.md); [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) IMP-003).

### 2.2 `context-shift` — lateral move between peer entities

- **Tokens:** `--duration-slow` (320ms) · `--ease-standard`.
- **Choreography:** an 8px directional translate of the incoming content region paired with a short opacity rise; outgoing content holds until the incoming commits (no flash of empty shell). Direction is reading-order (incoming from the trailing edge).
- **Surfaces:** event → character, event → period, story-event → event reader, period hierarchy navigation, explore/story-browser → list-to-list ([01 §2–§3](../01-ux-principles.md); flows F3–F6).

### 2.3 `cross-fade` — content swap that is not a spatial move

- **Tokens:** `--duration-base` (200ms) · `--ease-standard`.
- **Choreography:** opacity-only swap of the changing region; layout position is stable (no translate). Used where the reader stays "in place" and only the data changes.
- **Surfaces:** facet/filter result updates on `/explore` + `/stories`; scale-toggle re-render (`?scale=`) on the canvas; search-result region (when search ships).

### 2.4 `enter-exit` — overlays and panels

- **Tokens:** enter `--duration-slow` (320ms) `--ease-decelerate`; exit `--duration-fast` (120ms) `--ease-accelerate`.
- **Choreography:** dialogs/sheets/popovers/lightboxes scale-from-95%+fade on enter, fade-out on exit. Bottom sheets (mobile popover) translate up from the trailing edge on enter, down on exit. Asymmetric timing (slower in, faster out) keeps dismissal feeling responsive.
- **Surfaces:** event popover + cluster preview panel ([03](03-timeline-reader.md)); media lightbox ([06-event-detail](06-event-detail.md)); mobile nav panel ([00-app-shell](00-app-shell.md)); breadcrumb ellipsis popover ([03](03-timeline-reader.md)); track-add picker ([09](09-comparative-viewer.md)).

### 2.5 `ambient-presence` — unobtrusive live-update signal

- **Tokens:** opacity-only, ≤ `--duration-base` (200ms); **no translation token**.
- **Choreography:** the live dot near the brand and the stale-content banner fade in/out only. Never pulses, blinks, slides, or scales — it must never steal focus or scroll position ([01 §6](../01-ux-principles.md); PRD §2.2.10).
- **Surfaces:** app-shell live dot ([00](00-app-shell.md)); stale-content banner on every Realtime-subscribed surface (see [§3](#3-ambient-presence--stale-content-banner)).

---

## 3. `ambient-presence` — stale-content banner

Closes the "stale-content banner copy/placement/timing" item deferred to #172 ([02 §3](../02-screen-inventory.md), [04 gaps](../04-wireframes/README.md)).

- **Placement:** a slim, full-width bar pinned to the **top of the content viewport** (below the app-shell nav, above screen content). It is in-flow on mobile (pushes content down, no overlap) and sticky-top on desktop. It never overlaps the canvas controls or the reading column.
- **Copy:**
  - On subscription drop: **"Live updates paused — reconnecting…"** (no action required; reconnect is automatic).
  - On reconnect with new published rows in the visible window: **"New updates available"** + a quiet **"Refresh"** affordance that re-fetches the visible window in place.
  - On the canvas specifically the first line may read **"Live updates paused"** to match the per-screen edge-case copy in [03](03-timeline-reader.md) / [02 §3](../02-screen-inventory.md).
- **Timing:** fade in over `--duration-base` (200ms) on state change; auto-dismiss the "paused" banner via `cross-fade` within 200ms of successful resubscribe. The "New updates available" banner persists until the reader refreshes or dismisses it (it never auto-mutates content under the reader).
- **Focus/scroll:** the banner is an `aria-live="polite"` region; it does **not** move focus or scroll. A keyboard user can reach **Refresh** via Tab but is never forced to.
- **Per-track variant (comparative viewer):** each track owns its own banner state ([09](09-comparative-viewer.md)); one track's stale state never blanks another.

---

## 4. Global motion rules

Restated from [01 §6](../01-ux-principles.md) and [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md), now binding on the values above:

1. **Interruptible.** No transition blocks input. A second gesture retargets or replaces the first (critical for `fractal-zoom`).
2. **Motion never carries information alone.** Every animated change is true in the static end state; a reduced-motion or colorblind reader loses nothing by skipping the animation.
3. **No banned motion, ever.** No scroll-driven animation, parallax, custom cursors, or magnetic buttons ([ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md)) — reduced-motion or not.
4. **Realtime is quiet.** `ambient-presence` never steals focus or scroll ([§3](#3-ambient-presence--stale-content-banner)).
5. **Orientation is static.** The zoom-stack breadcrumb is always present without animation; wayfinding never depends on the animated path.

---

## 5. Reduced-motion contract

The binding rule from [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md): under `prefers-reduced-motion: reduce`, **every duration token resolves to `--duration-instant` (0ms)** and no class performs translation/scale interpolation. Per-class result:

| Class              | Normal                             | Reduced-motion result                              |
| ------------------ | ---------------------------------- | -------------------------------------------------- |
| `fractal-zoom`     | 480ms camera flight                | Instant cut to destination fit; no scaling/pan     |
| `context-shift`    | 320ms translate + fade             | Instant content replacement; no translate, no fade |
| `cross-fade`       | 200ms opacity swap                 | Instant content replacement; no fade               |
| `enter-exit`       | 320ms in / 120ms out, scale + fade | Instant appearance / dismissal; no scale, no slide |
| `ambient-presence` | ≤200ms opacity fade                | Static state change only; no fade, no pulse        |

This is enforced **once** at the token layer (a global `@media (prefers-reduced-motion: reduce)` rule resolving durations to `0ms`), not per component ([ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) IMP-002), so no surface can ship un-reduced motion by omission.

---

## 6. Motion-class assignment matrix (per screen)

Which classes each screen fires. Per-screen detail lives in each screen doc's _Motion_ section.

| Screen                                            | fractal-zoom  | context-shift | cross-fade  |     enter-exit      | ambient-presence |
| ------------------------------------------------- | :-----------: | :-----------: | :---------: | :-----------------: | :--------------: |
| [00 App shell](00-app-shell.md)                   |       —       |       —       |      —      |       ✓ (nav)       |   ✓ (live dot)   |
| [01 Landing](01-landing.md)                       |  ✓ (→canvas)  |       ✓       |      ✓      |          —          |        ✓         |
| [02 Explore](02-explore.md)                       |  ✓ (→canvas)  |       ✓       | ✓ (facets)  |          —          |        ✓         |
| [03 Timeline reader](03-timeline-reader.md)       |       ✓       |       ✓       |  ✓ (scale)  | ✓ (popover/cluster) |        ✓         |
| [04 Story browser](04-story-browser.md)           |       —       |       ✓       | ✓ (facets)  |          —          |        ✓         |
| [05 Story reader](05-story-reader.md)             |  ✓ (→canvas)  |       ✓       |      —      |      ✓ (media)      |        ✓         |
| [06 Event detail](06-event-detail.md)             |  ✓ (→canvas)  |       ✓       |      —      |      ✓ (media)      |        ✓         |
| [07 Character profile](07-character-profile.md)   |       —       |       ✓       |      —      |      ✓ (media)      |        ✓         |
| [08 Period detail](08-period-detail.md)           |  ✓ (→canvas)  |       ✓       |      —      |          —          |        ✓         |
| [09 Comparative viewer](09-comparative-viewer.md) | ✓ (per track) |       ✓       |  ✓ (scale)  |     ✓ (picker)      |  ✓ (per track)   |
| [10 Search](10-search.md)                         |       —       |       —       | ✓ (results) |          —          |        —         |
| [11 Not found](11-not-found.md)                   |       —       |       —       |      —      |          —          |        —         |

---

## 7. Verification (motion portion of #172)

- [x] **Motion behavior documented with timing/intent** — §1 token values, §2 per-class choreography (duration + easing + movement + interruptibility).
- [x] **Reduced-motion behavior per class** — §5 contract table; enforced at token layer.
- [x] **Stale-content banner copy/placement/timing resolved** — §3 (closes the [04 gaps](../04-wireframes/README.md) + [05 §13.1](../05-interaction-specification.md) item).
- [x] **Per-screen motion assignments** — §6 matrix + each screen doc's _Motion_ section.
- [x] **Traceable to upstream** — every class cites [01 §6](../01-ux-principles.md); values governed by [ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md); anti-patterns honor [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md).

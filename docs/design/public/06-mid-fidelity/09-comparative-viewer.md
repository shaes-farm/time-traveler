# 09 — Comparative Viewer (mid-fidelity)

Builds on: [04 wireframe — Comparative viewer](../04-wireframes/09-comparative-viewer.md) · [05 interaction spec §5.3](../05-interaction-specification.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/compare` · Flows: F5 · MVP-optional (stretch)
Resolves for this screen: shared-event indicator + track-limit UX (deferred to #172 by [04 gaps](../04-wireframes/README.md) + F5).

**Purpose.** Align 2–4 published timelines on a shared time axis (PRD §2.2.9), selected via `?t=` params. Per-track renderer instances (#65) under one shared scale control. Structure from the [04 wireframe](../04-wireframes/09-comparative-viewer.md).

## Visual hierarchy + token callouts

- **Shared axis:** one global temporal axis spanning all tracks; mono tabular year labels. **One global scale mode** across tracks ([05 §5.3](../05-interaction-specification.md)).
- **Tracks (2–4):** stacked horizontal lanes, each a renderer instance with its own header (timeline title + `×` remove). Each track on `--color-surface` with a `--color-border-muted` divider.
- **Shared-event indicator (resolves [04 gaps](../04-wireframes/README.md)):** an event present in 2+ tracks via the `timeline_events` junction renders a **connector tick** in the inter-track gutter aligned to the shared axis position, plus a small **link glyph + count badge** ("shared ×2") on each instance of the marker. It is **never color-only** — the glyph + badge carry the signal; an optional accent ring is a redundant layer. Hovering/focusing one instance highlights its peers.
- **Track-limit UX (resolves [04 gaps](../04-wireframes/README.md)):** up to **4** tracks. The **+ Add timeline** control deactivates (`aria-disabled`) at 4 with a tooltip "Up to 4 timelines"; the **Add to compare** affordance on [02 explore](02-explore.md) cards likewise deactivates at 4 selected. Fewer than 2 tracks → the "Add at least 2 timelines to compare" prompt (empty state).

## Component states

| Module              | States                                                              |
| ------------------- | ------------------------------------------------------------------- |
| Track header `×`    | default · hover · focus-visible                                     |
| Shared scale toggle | log · linear · focus-visible (applies to all tracks)                |
| + Add timeline      | default · focus-visible · disabled at 4 (`aria-disabled` + tooltip) |
| Add-timeline picker | `enter-exit` search panel of published timelines                    |
| Shared-event marker | default · hover (highlights peers) · focus-visible · selected       |
| Per-track           | default · loading · error (isolated) · stale (per-track banner)     |

## System states

- **<2 tracks:** "Add at least 2 timelines to compare" + picker; no axis until 2 ([02 §3](../02-screen-inventory.md)).
- **Per-track unavailable:** that track shows "This timeline is no longer available"; others continue ([02 §3](../02-screen-inventory.md) per-track isolation).
- **Loading:** per-track skeletons.
- **Connection-loss:** per-track stale indicator; per-track resubscribe ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** stacked tracks, shared axis full-width. **Tablet:** tracks stack; controls wrap. **Mobile:** comparative viewing is degraded — recommend a max of 2 tracks and vertical scrolling between them; the picker becomes a sheet ([04](../04-wireframes/09-comparative-viewer.md)).

## Motion

- **`fractal-zoom`** per track on shared-axis zoom (all tracks zoom in sync, instant-interruptible); **`cross-fade`** shared scale toggle; **`context-shift`** entering the viewer; **`enter-exit`** add-timeline picker; **`ambient-presence`** per-track stale. **Reduced-motion:** per-track re-render instant; shared-event highlights static (no pulse) ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern             | Spec                                                                                                                         |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order         | skip-link → nav → `h1` "Compare" → shared scale toggle → + Add timeline → track 1 (header `×` → canvas) → track 2 … → footer |
| 2   | Shared scale        | one global mode; toggle announces "Linear/Logarithmic scale, all tracks" ([accessibility-spec §4.1](accessibility-spec.md))  |
| 3   | Shared-event SR     | shared marker announces "shared across N timelines"; peers reachable ([accessibility-spec §6](accessibility-spec.md))        |
| 4   | Track limit         | + Add `aria-disabled` at 4 with tooltip; no silent failure                                                                   |
| 5   | Per-track isolation | one track's error/stale state never blanks another; each canvas independently keyboard-operable                              |
| 6   | Reduced-motion      | sync zoom instant; highlights static ([motion-spec §5](motion-spec.md))                                                      |

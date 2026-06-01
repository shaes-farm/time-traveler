# 03 — Timeline Reader

**Purpose.** The fractal zoomable canvas for a single timeline (`/:username/timelines/:slug`) — events, period bands, and character overlays on a continuous temporal axis (PRD §2.2.2–2.2.3; [02](../02-screen-inventory.md) §2 screen 3). This is the **renderer-bearing screen**: it hosts the canvas renderer (#65), the logarithmic/linear scale toggle (#66/#67), the fractal zoom-stack drill (#68), and the period/character overlay layers (#69).

**Flows:** F1 (inspect events), F2 (fractal deep zoom + reset), F4 (reconvergence target), F6 (period band → canvas).

## Data shown

- Timeline canvas: events positioned on the temporal axis, period bands, character overlays
- Zoom-stack breadcrumb (root → sub-timeline levels; #68)
- Scale toggle: `?scale=logarithmic` (long-span default) / `linear` (#66/#67)
- Event popovers / cluster overlays; per-event drill-in `⤵` when `events.detail_timeline_id` is set (#177)
- Overlay toggles: period bands (`period_timelines`), character overlays (`event_characters`)

## Primary actions

- Pan / zoom the canvas (key bindings owned by #171)
- Toggle scale (log ↔ linear)
- Open an event popover → event detail (`context-shift`)
- Drill into a sub-timeline via `⤵` (`fractal-zoom`; F2) — blocked on #177
- Jump zoom levels via breadcrumb; **Reset zoom** to root
- Toggle period-band / character overlays

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Cosmic history ▸ Evolution of life ▸ Cambrian detail        [ ⟲ Reset zoom ] │  ← zoom-stack breadcrumb
│  ───────────────────────────────────────────────────────────────────────────  │
│  Scale: ( ●Log  ○Linear )   Overlays: [✓ Periods] [✓ Characters]    [⤢ Compare]│  ← canvas controls
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  ◀ pan                                                          pan ▶     │ │
│  │  ░░░░░ Hadean ░░░░│▒▒▒ Archean ▒▒▒│▓ Proterozoic ▓│██ Phanerozoic ██     │ │  ← period bands (#69)
│  │  ·          ·            ·    ·         · ●(cluster ×7)   ·   ·          │ │  ← events on axis
│  │  ●Earth forms ⤵      ●First cells       ●Cambrian explosion ⤵           │ │  ← event + drill-in
│  │  ╴╴╴╴ Marie Curie ╴╴╴╴╴╴╴╴ (character overlay lane) ╴╴╴╴╴                │ │  ← character overlay (#69)
│  │                                                                          │ │
│  │  |————————|————————|————————|————————|————————|————————|————————|        │ │  ← temporal axis (log)
│  │ 13.8BYA  4BYA    1BYA    540MYA   250MYA   65MYA    now                  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│   ┌─ event popover ────────────────────┐                                       │
│   │ Cambrian explosion                 │  ← enter-exit overlay on select       │
│   │ 538 MYA · approximate              │                                       │
│   │ ★★★★★ · 3 participants             │                                       │
│   │ [ Open event → ]  [ Zoom into ⤵ ]  │                                       │
│   └────────────────────────────────────┘                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile frame (structural reflow)

```
┌────────────────────────┐
│ ⏳ TT             ☰    │
├────────────────────────┤
│ Cosmic ▸ … ▸ Cambrian  │  ← breadcrumb truncates
│ [⟲ Reset]   [Layers ▾] │
│ (●Log ○Linear)         │
│ ┌────────────────────┐ │
│ │ ░Hadean│▒Archean│… │ │  ← bands compress
│ │ ·  ·  ●(×7) ·  ·   │ │
│ │ ●Earth forms ⤵     │ │
│ │ ╴╴ M. Curie ╴╴     │ │
│ │ |——|——|——|——|——|   │ │
│ │ 13.8BYA … now      │ │
│ └────────────────────┘ │
│  pinch-zoom · drag-pan │
│ ┌─ popover (sheet) ──┐ │
│ │ Cambrian explosion │ │  ← popover = bottom sheet
│ │ 538 MYA · approx   │ │
│ │ [Open →] [Zoom ⤵]  │ │
│ └────────────────────┘ │
└────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** full canvas with inline scale toggle + overlay toggles; event popover floats anchored to the selected event.
- **Tablet (640–1023px):** canvas controls wrap to a second row; overlay toggles collapse into a **Layers ▾** menu; popover floats.
- **Mobile (<640px):** breadcrumb truncates middle levels with `…`; controls collapse into a **Layers ▾** menu + a compact scale toggle; canvas uses pinch-zoom + drag-pan; the event popover becomes an `enter-exit` bottom sheet. Exact touch gesture bindings owned by #171.

## Annotations

1. **The canvas is the renderer (#65).** The entire plotted region is the renderer foundation — events on a temporal axis with period bands and character overlays. This wireframe fixes _where_ the renderer and its controls live; the rendering engine itself is #65. Data: `timeline_events`, event temporal JSONB, `sort_order_years`.
2. **Scale toggle = #66/#67 via `?scale=`.** `logarithmic` is the long-span default (#66; appropriate for billion-year spans, [00](../00-ia-route-model.md) §3.2); `linear` is the toggle target (#67). The control writes `?scale=` to the URL so the view is shareable. F1 edge case: switching to linear on a billion-year span compresses geological events toward the origin — non-blocking, user intent respected.
3. **Zoom-stack breadcrumb = #68 orientation.** Each segment is a zoom level; clicking a segment jumps to that level (`fractal-zoom` out). Orientation is _always_ present so wayfinding never depends on the animated path ([01](../01-ux-principles.md) §7; F2 steps 6–7). Deep stacks truncate middle levels with `…` (model owned by #171). Data: zoom-stack derived from the `detail_timeline_id` chain.
4. **Drill-in `⤵` = #68 + #177 (BLOCKED).** An event with `events.detail_timeline_id` set shows a `⤵` decomposition affordance — visually distinct from the "appears in" lateral link ([00](../00-ia-route-model.md) §5.2 rule 2: containment vs. decomposition). **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177)**: until the column ships, no event renders a `⤵` and F2 drill is inert. The rest of the screen functions normally.
5. **Period bands + character overlays = #69.** Period bands (`period_timelines`) render as horizontal background bands behind the axis; character overlays (`event_characters`) render as lanes spanning a character's participation window. Both are toggleable layers. A period band links to period detail (F6 step 6, `context-shift`). Data: `period_timelines`, `event_characters`.
6. **Event clusters.** Dense regions collapse to a cluster marker (`●(×7)`); an expand affordance surfaces the clustered events ([03](../03-user-flows.md) F1 step 6). The exact expand interaction + in-cluster pagination is **owned by #171**. Data: client-side clustering over event positions.
7. **Event popover → detail.** Selecting an event opens an `enter-exit` popover with `TemporalDisplay` (era + precision always present — "538 MYA · approximate", [00](../00-ia-route-model.md) §5.2 rule 4), significance (★ ramp), participant count, and two actions: **Open event** (`context-shift` to screen 06) and **Zoom into** (`⤵`, F2). Data: event row + `event_characters` count.
8. **Compare affordance (⤢).** A quick path to add this timeline to the comparative viewer (screen 09, F5). MVP-optional; hidden if `/compare` is not built.
9. **`?at=` deep-link anchor.** The canvas can deep-link to a temporal position via `?at=<sort_order_anchor>` (F2 step 9); if the anchored event is unpublished the canvas loads the root position gracefully — no error.

## Edge cases

- **Timeline with no events.** Empty canvas showing the span with a "No events yet" message ([02](../02-screen-inventory.md) §3; F1 edge case).
- **Sub-timeline with no events (F2).** Empty canvas at the sub-timeline's span; "No events in this sub-timeline."
- **Dense cluster (100+ events).** Expand shows a bounded preview; full in-cluster pagination owned by #171.
- **Loading.** Canvas skeleton + progressive event hydration; period bands appear once data is ready.
- **Error.** Renderer-scoped error boundary; the rest of the shell stays usable ([02](../02-screen-inventory.md) §3).
- **Connection loss (Realtime).** "Live updates paused" banner; auto-resubscribe + re-fetch of the visible window on reconnect. Events that become unpublished render as inert markers until reload ([02](../02-screen-inventory.md) §3; F1 edge case).
- **`?at=` anchor unpublished.** Canvas loads at root position; no error surfaced (F2 step 9).
- **Deep zoom stack (5+ levels).** Breadcrumb truncates middle with `…`; **Reset zoom** returns to root in one action (F2 steps 6–8).

## Open questions

> **Resolved (this pass):** Scale toggle is URL-driven `?scale=` (log default, linear toggle). Zoom-stack breadcrumb is always visible (orientation never animated-only). Drill-in `⤵` is distinct from the "appears in" lateral link.
>
> **Blocked:** drill-in `⤵` on [#177](https://github.com/shaes-farm/time-traveler/issues/177) (`events.detail_timeline_id`).
>
> Deferred to **#171:** exact pan/zoom key + touch bindings; cluster-expand affordance + in-cluster pagination; breadcrumb truncation model; Reset-zoom placement. Deferred to **#172:** band/overlay/event visual treatment; motion timing for `fractal-zoom`; stale-banner copy.

# 09 — Comparative Viewer

**Status: MVP-optional (stretch).** In scope only if `/compare` is built for the initial release ([02](../02-screen-inventory.md) §2 screen 9; [03](../03-user-flows.md) F5). If deferred, F1–F4 and F6 are unaffected. Documented here for completeness so the IA stays stable when it ships.

**Purpose.** Align 2–4 published timelines on a shared temporal axis for side-by-side reading (PRD §2.2.9). Each track is a renderer instance (#65) sharing one axis + one scale control (#66/#67).

**Flows:** F5 (add timelines → align → compare).

## Data shown

- 2–4 aligned tracks, each a renderer instance over one timeline (#65)
- A single shared temporal axis spanning all tracks
- Shared scale toggle (`?scale=`, #66/#67)
- Shared-event indicators (events appearing in multiple tracks via `timeline_events`)
- Track add/remove controls; `?t=` params drive track membership

## Primary actions

- Add / remove a track (`+ Add timeline`, per-track ×)
- Zoom/pan the shared axis (all tracks move in sync)
- Toggle scale (log ↔ linear) across all tracks
- Open an event on a track → event detail (`context-shift`)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Compare timelines                          Scale: ( ●Log ○Linear )            │
│  ───────────────────────────────────────────────────────────────────────────  │
│  Curie biography                                                        [ × ]  │  ← track 1 header
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  ·    ●Discovery of polonium      ●Nobel(shared◇)      ·                  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Women in science                                                       [ × ]  │  ← track 2 header
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │      ·        ●Marie Curie b.     ●Nobel(shared◇)   ●Lovelace   ·         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  [ + Add timeline ]                                                            │
│  |————————|————————|————————|————————|————————|————————|————————|             │  ← single shared axis
│ 1700CE    1800CE   1850CE   1900CE   1950CE   2000CE   now                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** stacked tracks over one shared axis as drawn; scale control top-right.
- **Tablet (640–1023px):** tracks stack; track headers wrap; shared axis remains full-width.
- **Mobile (<640px):** comparison is hard at phone width — tracks stack vertically with a synchronized horizontal pan; the shared axis pins to the bottom. A note suggests landscape/wider viewport for richer comparison. (This screen is MVP-optional and desktop/tablet-first; mobile is a graceful-degradation target, exact treatment owned by #172.)

## Annotations

1. **Each track = one renderer instance (#65).** The renderer foundation is instanced per-track ([02](../02-screen-inventory.md) §5; F5 step 4). This wireframe fixes the multi-track composition; the renderer itself is #65. Data: per-track `timeline_events`.
2. **One shared axis + one scale control (#66/#67).** A single temporal axis spans all tracks; the scale toggle propagates to every track simultaneously (F5 steps 5–6). `?scale=logarithmic` is the default. Data: union span of all tracks for axis extent.
3. **Track membership = `?t=` params.** Each track is a `?t=username%2Fslug` param (F5 step 3); up to 4. The set is shareable/bookmarkable via the URL. Data: resolved published timelines.
4. **Shared-event indicator (◇).** Events appearing in multiple tracks (via the `timeline_events` junction) get a shared-event marker aligned across tracks. **Exact indicator design owned by #172.** Data: `timeline_events` intersection across selected timelines.
5. **Add/remove tracks.** `+ Add timeline` opens a published-timeline picker (F5 step 8); per-track `×` removes. The **Add** affordance deactivates at 4 tracks with an explanatory tooltip (UX owned by #171). Below 2 tracks the viewer shows the "add a timeline to compare" prompt. Data: client-side track set + picker query.
6. **Per-track error isolation.** If one track's timeline becomes unavailable, that track shows a per-track error ("no longer available") while the others continue ([02](../02-screen-inventory.md) §3; F5 edge case). Data: per-track fetch state.
7. **Entry from Explore (F5).** Tracks are typically seeded from the Explore add-to-compare affordance (screen 02 annotation 5) which assembles the `?t=` params and navigates here.

## Edge cases

- **Fewer than 2 tracks (startup / after removal).** "Add at least 2 timelines to compare" prompt + picker; no axis renders until 2 tracks exist ([02](../02-screen-inventory.md) §3; F5 step 7).
- **One track unavailable mid-session.** Per-track error state; other tracks unaffected (per-track isolation).
- **More than 4 selected.** Add affordance deactivates at 4 with a tooltip (UX owned by #171).
- **Mismatched spans (very different scales).** Log scale handles gracefully; switching to linear may compress one track — non-blocking, user intent respected (F5 edge case).
- **Loading.** Per-track skeletons.
- **Connection loss (Realtime).** Per-track stale indicator; per-track auto-resubscribe ([02](../02-screen-inventory.md) §3).

## Open questions

> **Resolved (this pass):** One shared axis + one scale control across all tracks; track membership via `?t=` params (cap 4); per-track error isolation. **MVP-optional** — entire screen ships only if `/compare` is built.
>
> Deferred to **#171:** track-cap tooltip UX; add-timeline picker interaction. Deferred to **#172:** shared-event indicator design; mobile comparison degradation; track visual treatment.

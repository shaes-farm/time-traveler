# Public Reader — Prototype Wireflow (navigable clickthrough)

Status: **draft 1** — the "clickable prototype" for #173, delivered as a navigable markdown wireflow.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#173](https://github.com/shaes-farm/time-traveler/issues/173)
Builds on: [03 — User flows](../03-user-flows.md) · [04 — Wireframes](../04-wireframes/) · [05 — Interaction spec](../05-interaction-specification.md) · [06 — Mid-fidelity](../06-mid-fidelity/) · [06 motion-spec](../06-mid-fidelity/motion-spec.md) · [06 accessibility-spec](../06-mid-fidelity/accessibility-spec.md)

> **What this is.** A click-by-click walkthrough of the core reader journeys, wired from the existing artifacts. Each **node** is a screen (its mid-fi comp is the rendered state); each **click** names the target affordance, the resulting route, the state change, and the transition (motion class + token from [motion-spec §1–§2](../06-mid-fidelity/motion-spec.md)). It chains the [04 wireframe frames](../04-wireframes/) and [06 mid-fi comps](../06-mid-fidelity/) into traversable paths so navigation and transition behavior can be inspected and validated end-to-end **without writing app code** (the epic is markdown-only; `apps/reader` is unbuilt until #65, [ADR-0030](../../../adr/adr-0030-public-reader-app-placement.md)).
>
> **Why markdown, not Figma/HTML.** The whole #165 chain (00–06) is markdown spec docs ([06 README "Format (no Figma)"](../06-mid-fidelity/README.md)). The "prototype" is therefore a **link-traversable clickthrough**: every node links to its source comp, every click links to the destination node, and the transition/state column is the behavioral contract from [05](../05-interaction-specification.md). This satisfies #173's "prototype demonstrates core navigation and transition behaviors" while honoring "out of scope: production implementation."

---

## How to read this prototype

- **Node `Nx`** = a screen state. Open the linked comp to "see" it.
- **Click rows** are the affordances active in that state. Follow the **→ destination** link to traverse.
- **Transition** = the motion class fired ([motion-spec §2](../06-mid-fidelity/motion-spec.md)) with its duration token; under `prefers-reduced-motion` every one collapses to `--duration-instant` ([motion-spec §5](../06-mid-fidelity/motion-spec.md)).
- **Flow tag** ties the path back to its canonical flow in [03](../03-user-flows.md) (F1–F6).
- Keyboard and reduced-motion traversal are **the same node graph** — see [§A](#a-keyboard-only-traversal) / [§B](#b-reduced-motion-traversal); they are not separate prototypes.

### Node map

| Node | Screen (comp)                                                     | Route                         |
| ---- | ----------------------------------------------------------------- | ----------------------------- |
| N0   | [App shell](../06-mid-fidelity/00-app-shell.md)                   | _wraps all routes_            |
| N1   | [Landing](../06-mid-fidelity/01-landing.md)                       | `/`                           |
| N2   | [Explore](../06-mid-fidelity/02-explore.md)                       | `/explore`                    |
| N3   | [Timeline reader](../06-mid-fidelity/03-timeline-reader.md)       | `/:username/timelines/:slug`  |
| N4   | [Story browser](../06-mid-fidelity/04-story-browser.md)           | `/stories`                    |
| N5   | [Story reader](../06-mid-fidelity/05-story-reader.md)             | `/:username/stories/:slug`    |
| N6   | [Event detail](../06-mid-fidelity/06-event-detail.md)             | `/:username/events/:slug`     |
| N7   | [Character profile](../06-mid-fidelity/07-character-profile.md)   | `/:username/characters/:slug` |
| N8   | [Period detail](../06-mid-fidelity/08-period-detail.md)           | `/:username/periods/:slug`    |
| N9   | [Comparative viewer](../06-mid-fidelity/09-comparative-viewer.md) | `/compare`                    |
| N11  | [Not found](../06-mid-fidelity/11-not-found.md)                   | `404`                         |

(Search N10 is post-MVP / stubbed — [06 README](../06-mid-fidelity/README.md) — and is not exercised here.)

---

## Path 1 — Timeline-first: discover → zoom → inspect event (tag: [F1](../03-user-flows.md#f1--timeline-first-discover--zoom--inspect-event))

**Goal:** validate the primary timeline journey and the `context-shift → fractal-zoom → enter-exit → context-shift` transition chain.

| Step | Node | Click target                                    | → Destination                            | State change                                                                                                                                 | Transition                                                                                |
| ---- | ---- | ----------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1.1  | N1   | Hero dual-CTA **Explore** (or top-nav)          | → **N2** `/explore`                      | List surface loads; facet rail visible; grid skeleton                                                                                        | `context-shift` `--duration-slow` (320ms)                                                 |
| 1.2  | N2   | Era facet `era=bya` + type facet `type=general` | → **N2** `/explore?era=bya&type=general` | Grid re-fetches in place; facets persist in URL; result count updates                                                                        | `cross-fade` `--duration-base` (200ms) ([motion §2.3](../06-mid-fidelity/motion-spec.md)) |
| 1.3  | N2   | Timeline card **"Cosmic history"**              | → **N3** `/:u/timelines/cosmic-history`  | Canvas enters; `?scale=logarithmic` default ([05 §5.1](../05-interaction-specification.md)); breadcrumb shows level 1                        | `fractal-zoom` `--duration-deliberate` (480ms), origin = card                             |
| 1.4  | N3   | Activate dense cluster near a period band       | → **N3** (cluster preview panel)         | `ClusterPreview` state ([05 §2](../05-interaction-specification.md)); panel shows ≤25 events ([05 §7.2](../05-interaction-specification.md)) | `enter-exit` enter `--duration-slow` (320ms)                                              |
| 1.5  | N3   | Cluster row **"Cambrian explosion"**            | → **N6** `/:u/events/cambrian-explosion` | Selection cleared on route transition ([05 §3.3](../05-interaction-specification.md)); event detail loads                                    | `context-shift` `--duration-slow` (320ms)                                                 |

**Branch 1a — scale toggle (tags: [#66](https://github.com/shaes-farm/time-traveler/issues/66)/[#67](https://github.com/shaes-farm/time-traveler/issues/67)):** at N3, toggle **Linear/Logarithmic** → route path unchanged, `?scale=` query flips, `viewportCenter` anchor preserved, `semanticLevel` recomputed ([05 §5.2](../05-interaction-specification.md)); `cross-fade` re-render ([motion §2.3](../06-mid-fidelity/motion-spec.md)). SR announces _"Linear scale" / "Logarithmic scale"_ immediately ([a11y §4.1](../06-mid-fidelity/accessibility-spec.md)).

---

## Path 2 — Fractal deep zoom + return (tag: [F2](../03-user-flows.md#f2--fractal-deep-zoom--return--reset-context), [#68](https://github.com/shaes-farm/time-traveler/issues/68))

**Goal:** validate drill-in/out, the zoom-stack breadcrumb, and reset. **Now unblocked** — `events.detail_timeline_id` shipped in [#177](https://github.com/shaes-farm/time-traveler/issues/177) (closed), so the `⤵` affordance is live (was the gating dependency in [03 F2 note](../03-user-flows.md#f2--fractal-deep-zoom--return--reset-context)).

| Step | Node | Click target                                  | → Destination                              | State change                                                                                                   | Transition                           |
| ---- | ---- | --------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2.1  | N3   | Event drill-in **`⤵`** ("Earth forms")        | → **N3** `/:u/timelines/evolution-of-life` | `zoomDepth` 1→2 ([05 §3.2](../05-interaction-specification.md)); breadcrumb appends level 2; fit-to-child-root | `fractal-zoom` 480ms (zoom-in)       |
| 2.2  | N3   | Event drill-in **`⤵`** ("Cambrian explosion") | → **N3** `/:u/timelines/cambrian-detail`   | `zoomDepth` 2→3; breadcrumb 3 segments inline ([05 §8.3](../05-interaction-specification.md))                  | `fractal-zoom` 480ms                 |
| 2.3  | N3   | Breadcrumb segment **"Evolution of life"**    | → **N3** (level 2)                         | Breadcrumb jump to ancestor; `zoomDepth`→2 ([05 §3.2 rule 5](../05-interaction-specification.md))              | `fractal-zoom` 480ms (zoom-out)      |
| 2.4  | N3   | **Reset zoom** control / key `0`              | → **N3** (level 1 root)                    | Viewport fitted to root extent; `selectedEntity` cleared ([05 §4.4](../05-interaction-specification.md))       | `fractal-zoom` 480ms (interruptible) |

**Deep-stack branch:** at depth ≥4 the breadcrumb collapses middle segments into a `…` popover ([05 §8.3](../05-interaction-specification.md), `enter-exit`). Back/forward replays the route stack; focus → destination `h1` ([05 §8.4](../05-interaction-specification.md), [a11y §2.2](../06-mid-fidelity/accessibility-spec.md)).

---

## Path 3 — Story-first: browse → read → event reconvergence (tag: [F3](../03-user-flows.md#f3--story-first-browse--filter--read--event-reconvergence))

**Goal:** validate the story-browser journey and the story↔event↔timeline reconvergence.

| Step | Node | Click target                                   | → Destination                                 | State change                                                                                                  | Transition                        |
| ---- | ---- | ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 3.1  | N1   | Hero / top-nav **Stories**                     | → **N4** `/stories`                           | Story grid + facet rail load                                                                                  | `context-shift` 320ms             |
| 3.2  | N4   | Facets `narrator=third_person` + `tag=triumph` | → **N4** `/stories?narrator=…&tag=…`          | Grid re-fetches in place; facets persist in URL                                                               | `cross-fade` 200ms                |
| 3.3  | N4   | Story card **"The Curies' Quest"**             | → **N5** `/:u/stories/the-curies-quest`       | Long-form prose column + ordered event rail; perspective-character chip; narrator badge                       | `cross-fade` 200ms (list→reading) |
| 3.4  | N5   | Event-rail item **"Discovery of polonium"**    | → **N6** `/:u/events/discovery-of-polonium`   | Carries return context `?from=story&story=…&storyPos=…` ([05 §9.1](../05-interaction-specification.md))       | `context-shift` 320ms             |
| 3.5  | N6   | **Return to story** (header, from return ctx)  | → **N5** (rail scroll/focus restored)         | Restores rail position at `storyPos` ([05 §9.2](../05-interaction-specification.md))                          | `context-shift` 320ms             |
| 3.6  | N6   | "Appears in" timeline **"Curie biography"**    | → **N3** `/:u/timelines/curie-biography?at=…` | Canvas centers event marker if `?at=` resolves, else root fit ([05 §9.3](../05-interaction-specification.md)) | `fractal-zoom` 480ms              |

---

## Path 4 — Cross-link pivot (tag: [F4](../03-user-flows.md#f4--cross-link-pivot-and-reconvergence-between-entry-paths))

**Goal:** validate lateral `context-shift` pivots across peer entities and the typed-link contract.

| Step | Node | Click target                               | → Destination                               | State change                                                                                                                                                                  | Transition            |
| ---- | ---- | ------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 4.1  | N5   | Perspective chip **"Marie Curie · Human"** | → **N7** `/:u/characters/marie-curie`       | Type-identity header (icon + label + name, never icon-only)                                                                                                                   | `context-shift` 320ms |
| 4.2  | N7   | Character-timeline event row               | → **N6** `/:u/events/discovery-of-polonium` | Event detail; participants as typed links                                                                                                                                     | `context-shift` 320ms |
| 4.3  | N6   | "Part of period" **"Cambrian"**            | → **N8** `/:u/periods/cambrian`             | Period header `TemporalDisplay`; hierarchy breadcrumb; events-in-range (tag: [F6](../03-user-flows.md#f6--period-exploration-hierarchy--overlaid-timelines--events-in-range)) | `context-shift` 320ms |
| 4.4  | N8   | Overlaid timeline link                     | → **N3** `/:u/timelines/evolution-of-life`  | Enters canvas; period bands available as overlay (#69)                                                                                                                        | `fractal-zoom` 480ms  |

---

## Path 5 — Comparative viewer (tag: [F5](../03-user-flows.md#f5--comparative-viewer--align-two-timelines), MVP-optional)

Exercised only if `/compare` ships at MVP. At **N2**, **Add to compare** on two cards → **Compare (2)** → **N9** `/compare?t=…&t=…`. Shared axis; per-track `fractal-zoom` in sync; one global scale toggle; per-track stale/error isolation ([09 comp](../06-mid-fidelity/09-comparative-viewer.md)). Documented for completeness; **deferred from the MVP validation floor** below.

---

## Edge / recovery nodes (exercised across paths)

| From  | Trigger                      | → Node / state                          | Contract                                                                                                  |
| ----- | ---------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| N2/N4 | Facets return nothing        | empty state + **Clear filters**         | [03 edge tables](../03-user-flows.md#f1--timeline-first-discover--zoom--inspect-event)                    |
| any   | Unpublished / missing entity | → **N11** `404` (never 403)             | [03 consolidated states](../03-user-flows.md#consolidated-failure-and-recovery-states); inert cross-links |
| N3    | Connection loss              | stale banner **"Live updates paused"**  | non-blocking; resubscribe + visible-window refetch ([motion §3](../06-mid-fidelity/motion-spec.md))       |
| N3    | Empty timeline               | empty canvas, zoom/pan/reset still work | [05 §11](../05-interaction-specification.md)                                                              |

---

## A. Keyboard-only traversal

The node graph is identical; only the activation changes. First `Tab` reveals **Skip to content** ([a11y §1.1](../06-mid-fidelity/accessibility-spec.md)). `Tab`/`Enter`/`Space` activate every click target above; on the canvas, `=`/`-` zoom, arrows pan, `0` resets, `Enter` opens a focused cluster, `Escape` closes it ([a11y §1.2](../06-mid-fidelity/accessibility-spec.md)). On every route transition focus moves to the destination `h1` (`tabindex="-1"`); overlay dismissal returns focus to the trigger ([a11y §2.2](../06-mid-fidelity/accessibility-spec.md)). Input parity is required — every pointer outcome has a keyboard equivalent ([05 §10.4](../05-interaction-specification.md)).

## B. Reduced-motion traversal

Same graph; every Transition column value resolves to `--duration-instant` (0ms) — no camera flight, translate, or fade ([motion §5](../06-mid-fidelity/motion-spec.md)). Wayfinding never depends on the animated path: the zoom-stack breadcrumb, scale indicator, and selection state are all true in the static end state ([a11y §5](../06-mid-fidelity/accessibility-spec.md)).

---

## Coverage vs. #173 "primary timeline + story-browser journeys"

| #173 in-scope journey      | Covered by                         |
| -------------------------- | ---------------------------------- |
| Primary timeline           | Path 1 (+ branch 1a scale), Path 2 |
| Story-browser              | Path 3, Path 4 (pivot from story)  |
| Period / cross-link        | Path 4 (F6 leaf)                   |
| Comparative (MVP-optional) | Path 5 (deferred from floor)       |

The **MVP validation floor** is Paths 1–4 (flows F1–F4 + the F6 leaf), matching [03 handoff](../03-user-flows.md#handoff) ("F1–F4 + F6 as the end-to-end scenarios for prototype testing; F5 if `/compare` is built"). The findings in [01-validation-report.md](01-validation-report.md) walk this graph.

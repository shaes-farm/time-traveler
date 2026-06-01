# Public Reader — Low-Fidelity Wireframes

Status: **draft 1** — low-fidelity ASCII wireframes for every public reader screen, with responsive notes, interaction/data annotations, and flow-ID mappings.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#170](https://github.com/shaes-farm/time-traveler/issues/170)
Builds on: [00 — IA + route model](../00-ia-route-model.md) · [01 — UX principles](../01-ux-principles.md) · [02 — Screen inventory](../02-screen-inventory.md) · [03 — User flows](../03-user-flows.md)

> **What these wireframes are.** One low-fidelity wireframe per screen in the **public reader** surface (the anonymous, read-only experience for consuming _published_ temporal content). Each file fixes layout structure, the modules present, the system states (empty/loading/error/connection-loss), responsive reflow at mobile/tablet/desktop, and the interaction intents + data dependencies — annotated and mapped to the canonical flows (F1–F6) from [03](../03-user-flows.md).
>
> **What these wireframes are not.** Not final visual styling (tokens/comps are #172), not micro-interaction prototypes (#172), not interaction state-machine detail or exact key bindings (#171), and not engineering implementation. ASCII boxes are intentionally low-fidelity: they encode structure and hierarchy, not pixels. Routes, screen modules, system states, and the navigation graph are inherited verbatim from [00](../00-ia-route-model.md) and [02](../02-screen-inventory.md) and are not re-litigated here.

---

## How to read these wireframes

- **ASCII frames are structural, not pixel-accurate.** Box proportions communicate hierarchy and grouping, not exact sizes.
- **Desktop is the primary frame.** Tablet/mobile reflow is captured in prose under each screen's _Responsive behavior_ section; a second ASCII frame is drawn only where the reflow is structural (landing, explore, timeline reader, story reader).
- **Annotations are numbered** and call out interaction intent + the data dependency behind each module (table/column/junction/RPC), matching the admin wireframe convention in [`docs/design/admin/02-wireframes/`](../../admin/02-wireframes/).
- **Flow IDs (F1–F6)** reference [03 — User flows](../03-user-flows.md); each screen lists the flows that traverse it so the storyboard maps frame-to-frame.
- **Dark-mode only** ([ADR-0023](../../../adr/adr-0023-dark-mode-only-fidelity-2.md)); shared tokens, divergent motion/composition from admin ([ADR-0031](../../../adr/adr-0031-public-reader-design-divergence.md)).

## Wireframe index

| #   | Screen                                         | Route                         | Flows          | MVP status                 |
| --- | ---------------------------------------------- | ----------------------------- | -------------- | -------------------------- |
| 00  | [App shell](00-app-shell.md)                   | _wraps all routes_            | all            | **MVP**                    |
| 01  | [Landing / discovery](01-landing.md)           | `/`                           | F1, F3         | **MVP**                    |
| 02  | [Explore (timeline navigator)](02-explore.md)  | `/explore`                    | F1, F5         | **MVP**                    |
| 03  | [Timeline reader](03-timeline-reader.md)       | `/:username/timelines/:slug`  | F1, F2, F4, F6 | **MVP**                    |
| 04  | [Story browser](04-story-browser.md)           | `/stories`                    | F3             | **MVP**                    |
| 05  | [Story reader](05-story-reader.md)             | `/:username/stories/:slug`    | F3, F4         | **MVP**                    |
| 06  | [Event detail](06-event-detail.md)             | `/:username/events/:slug`     | F1, F3, F4, F6 | **MVP**                    |
| 07  | [Character profile](07-character-profile.md)   | `/:username/characters/:slug` | F4             | **MVP**                    |
| 08  | [Period detail](08-period-detail.md)           | `/:username/periods/:slug`    | F6             | **MVP**                    |
| 09  | [Comparative viewer](09-comparative-viewer.md) | `/compare`                    | F5             | **MVP-optional** (stretch) |
| 10  | [Global search](10-search.md)                  | `/search`                     | —              | **Post-MVP / stubbed**     |
| 11  | [Not found](11-not-found.md)                   | `404`                         | all (fallback) | **MVP**                    |

**MVP floor** (from [02](../02-screen-inventory.md) §2): screens 00–08 + 11 are the launch set; screen 09 (`/compare`) is MVP-optional; screen 10 (`/search`) is stubbed at launch.

## Flow → wireframe coverage (F1–F6)

Every canonical flow in [03](../03-user-flows.md) traverses a known set of these wireframes:

| Flow | Screens traversed (wireframes) |
| ---- | ------------------------------ |
| F1   | 00, 01, 02, 03, 06             |
| F2   | 00, 03 (recursive zoom levels) |
| F3   | 00, 01, 04, 05, 06             |
| F4   | 00, 05, 07, 06, 03             |
| F5   | 00, 02, 09 _(MVP-optional)_    |
| F6   | 00, 06, 08, 03                 |

## Gaps & blockers (for follow-on issues)

These are the unresolved items surfaced while wireframing; each is owned downstream so implementation is not silently blocked:

| Item                                                                          | Affects                    | Owner / blocker                                                                                                                 |
| ----------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `events.detail_timeline_id` (fractal drill-in `⤵` affordance)                 | 03 timeline reader (F2)    | [#177](https://github.com/shaes-farm/time-traveler/issues/177) — column ships                                                   |
| `story_events.sort_order` (narrative event ordering / reorder)                | 05 story reader (F3)       | [#183](https://github.com/shaes-farm/time-traveler/issues/183) — column ships                                                   |
| Exact key bindings, cluster-expand affordance, graph-layout for character net | 03, 07                     | [#171](https://github.com/shaes-farm/time-traveler/issues/171) interaction spec                                                 |
| Motion timing/easing, visual comps, stale-content banner copy/placement       | all                        | [#172](https://github.com/shaes-farm/time-traveler/issues/172) mid-fi + motion                                                  |
| Comparative-viewer shared-event indicator + track-limit UX                    | 09 comparative viewer (F5) | [#172](https://github.com/shaes-farm/time-traveler/issues/172) / [#171](https://github.com/shaes-farm/time-traveler/issues/171) |
| Global search full-text retrieval + result page                               | 10 search                  | Post-MVP (stubbed at launch, [02](../02-screen-inventory.md) §2)                                                                |

## Handoff

| Issue | Artifact                     | Consumes from these wireframes                                                                                    |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| #171  | Interaction specification    | Per-screen annotations flagged `#171-owned`; affordance placement; state-frame transitions.                       |
| #172  | Mid-fidelity + motion + a11y | Layout structure + state frames as the surfaces to comp; motion-class assignments from [03](../03-user-flows.md). |
| #173  | Prototype validation         | The MVP-floor screen set as the end-to-end surfaces to validate; F1–F4 + F6 storyboards.                          |

## Verification (issue #170 acceptance criteria)

- [x] **Lo-fi wireframes cover all priority public screens** — 00–11 (timeline navigator, story browser, all reader detail views, shell, search stub, 404).
- [x] **Wireframes include responsive variants** — each screen has a _Responsive behavior_ section (mobile/tablet/desktop); structural reflows get a second ASCII frame.
- [x] **Each screen includes annotations for interaction/data needs** — numbered _Annotations_ section per file maps each module to its interaction intent + data dependency.
- [x] **Wireframe set explicitly maps to user-flow IDs** — the index + each file's _Flows_ header cite F1–F6 from [03](../03-user-flows.md).
- [x] **Gaps/blockers enumerated for follow-on issues** — the [Gaps & blockers](#gaps--blockers-for-follow-on-issues) table above.

**Verification checks (from #170):**

- [x] **Wireframes are implementation-plannable and reviewable** — structural ASCII + annotations + states per screen.
- [x] **Wireframes referenced by #65–#69 as design prerequisites** — screen 03 (renderer #65/#66/#67/#69) and screen 09 (#65 per-track) carry the visualization-ticket touchpoints from [02](../02-screen-inventory.md) §5.

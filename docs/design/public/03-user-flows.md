# Public Reader — User Flows

Status: **draft 1** — six canonical flows with state changes, navigation transitions, edge cases, and accessibility variants
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#169](https://github.com/shaes-farm/time-traveler/issues/169)
Builds on: [00 — IA + route model](00-ia-route-model.md) · [01 — UX principles + visual direction](01-ux-principles.md) · [02 — Screen inventory + scope map](02-screen-inventory.md)

> **What this document is.** Six canonical end-to-end flows for the **public reader** — the anonymous, read-only experience for consuming _published_ temporal content. Each flow identifies the persona, numbered steps with the state change and navigation transition at each step, edge cases and recovery paths, and keyboard-only and reduced-motion variants. Flow IDs (F1–F6) are stable references so wireframes (#170) and the interaction spec (#171) can cite them.
>
> **What this document is not.** It is not wireframes (those are #170), interaction state-machine detail (#171), motion-timing or visual comps (#172), or engineering implementation. Where a step forces an interaction decision (e.g., exact key bindings, graph layout strategy, event-cluster expand affordance), it is flagged as owned by the relevant downstream issue rather than resolved here. Route shapes, screen modules, and system states are inherited from [00](00-ia-route-model.md) and [02](02-screen-inventory.md) and are not re-litigated.

---

## Flow index

| ID  | Flow                                                                                                                                           | Entry philosophy | PRD                | Key screens                                        | #65–#69            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ | -------------------------------------------------- | ------------------ |
| F1  | [Timeline-first: discover → zoom → inspect event](#f1--timeline-first-discover--zoom--inspect-event)                                           | Timeline-first   | §2.2.1→2.2.2→2.2.4 | Landing, Explore, Timeline reader, Event detail    | #65, #66, #67, #69 |
| F2  | [Fractal deep zoom + return / reset context](#f2--fractal-deep-zoom--return--reset-context)                                                    | Timeline-first   | §2.2.2             | Timeline reader (recursive)                        | #65, #68           |
| F3  | [Story-first: browse → filter → read → event reconvergence](#f3--story-first-browse--filter--read--event-reconvergence)                        | Story-first      | §2.2.7→2.2.4       | Landing, Story browser, Story reader, Event detail | —                  |
| F4  | [Cross-link pivot and reconvergence between entry paths](#f4--cross-link-pivot-and-reconvergence-between-entry-paths)                          | Both             | §2.2.5→2.2.4→2.2.2 | Character profile, Event detail, Timeline reader   | #65                |
| F5  | [Comparative viewer — align two timelines](#f5--comparative-viewer--align-two-timelines) _(MVP-optional)_                                      | Cross-cutting    | §2.2.9             | Explore, Comparative viewer                        | #65, #66, #67      |
| F6  | [Period exploration: hierarchy → overlaid timelines → events in range](#f6--period-exploration-hierarchy--overlaid-timelines--events-in-range) | Shared leaf      | §2.2.6             | Period detail, Timeline reader                     | #69                |

**Motion-class key** (from [01](01-ux-principles.md) §6 — exact timing/easing is #172's):
`fractal-zoom` — spatial continuity when changing temporal scale · `context-shift` — lateral move between peer entities · `cross-fade` — content swap, not spatial · `enter-exit` — overlays and panels · `ambient-presence` — unobtrusive live-update signal.

---

## F1 — Timeline-first: discover → zoom → inspect event

**Persona:** A curious reader encounters "Cosmic history" through the explore surface, applies era facets to narrow results, enters the fractal canvas, and inspects an event.

### Steps

1. **Land on `/`** (Landing / discovery, screen 1). State: loaded — featured timelines and stories in content rails, both CTAs visible. User selects **Explore** from the hero dual-CTA or the top nav.
2. **Navigate to `/explore`** (Timeline navigator, screen 2). State transition: `context-shift` from the landing surface. Facet rail appears immediately; timeline grid fetches with skeleton cards.
3. **Apply facets.** User picks `?era=bya` from the era facet and `?type=general` from the type facet. The URL becomes `/explore?era=bya&type=general`; the grid re-fetches (skeleton). Facets are preserved on refresh/share.
4. **Click a timeline card.** User selects "Cosmic history" → navigates to `/:username/timelines/cosmic-history`. State transition: `fractal-zoom` (spatial origin: the selected card). Scale defaults to `?scale=logarithmic` — the appropriate default for a billion-year span (PRD §2.2.3, [00](00-ia-route-model.md) §3.2).
5. **Timeline canvas loads** (Timeline reader, screen 3). Canvas skeleton hydrates progressively with events and period bands. Zoom-stack breadcrumb shows one level: _"Cosmic history"_. Period-band overlays appear (#69) once data is ready.
6. **Locate a dense event cluster.** The reader spots a cluster near the "Phanerozoic" period band. An expand affordance surfaces the clustered events (exact interaction owned by #171). State: cluster-detail overlay appears with `enter-exit`.
7. **Select an event.** User clicks "Cambrian explosion" within the cluster → navigates to `/:username/events/cambrian-explosion`. State transition: `context-shift`.
8. **Event detail loads** (Event detail, screen 6). Content: temporal range with `TemporalDisplay` (538 MYA, era MYA, precision `approximate`), importance badge, participants (`event_characters`), categories, "appears in" timelines, and a "zoom into ⤵" affordance if `detail_timeline_id` is set.

### Edge cases & recovery

| Scenario                                                        | Recovery                                                                                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Facets return no timelines                                      | "No timelines match your filters" empty state + **Clear filters** affordance; facets remain in URL for adjustment                              |
| Timeline canvas loads with no events                            | Empty canvas showing the timeline span with a "No events yet" message (§3 empty state)                                                         |
| Dense cluster contains 100+ events                              | Expand affordance shows a bounded preview; full pagination within the cluster is owned by #171                                                 |
| Scale toggle switched to `?scale=linear` on a billion-year span | Geological events compress toward the origin; non-blocking — user intent is respected                                                          |
| Event referenced on canvas becomes unpublished mid-session      | `ambient-presence` stale-content banner appears; canvas data refreshes on resubscribe; unpublished events render as inert markers until reload |
| Connection loss during canvas rendering                         | "Live updates paused" banner; auto-resubscribe + re-fetch of the visible window on reconnect (§3)                                              |
| Event is sparse (no participants, no categories)                | Sections gracefully omit on event detail (§3)                                                                                                  |

### Keyboard-only variant

Tab to **Explore** in top nav → Enter. Tab through facet rail (era chips, type select) → Space to toggle. Tab through timeline grid cards → Enter to open. Tab into canvas; arrow keys pan; keyboard zoom shortcuts (exact bindings owned by #171). Tab to cluster expand affordance → Enter. Tab into cluster event list → Enter to open event detail. Focus ring always visible.

### Reduced-motion variant

Step 4 (`fractal-zoom`): instant canvas load, no spatial zoom fly-through. Step 6 (`enter-exit` cluster overlay): instant reveal. Step 7 (`context-shift`): instant navigation. No entrance animations on event detail sections. Zoom-stack breadcrumb updates synchronously.

---

## F2 — Fractal deep zoom + return / reset context

**Persona:** A deep-time explorer on the "Cosmic history" canvas drills into a sub-timeline, continues deeper, then navigates back to the root.

> **Implementation note:** the drill-in affordance (`⤵`) depends on `events.detail_timeline_id` ([#177](https://github.com/shaes-farm/time-traveler/issues/177)). Until that column ships, no event displays a `⤵` and this flow is blocked in implementation. The rest of the reader functions normally.

### Steps

1. **On `/:username/timelines/cosmic-history`** (Timeline reader, screen 3). Zoom-stack breadcrumb: _"Cosmic history"_ (root, level 1).
2. **Locate an event with a sub-timeline.** "Earth forms (4.5 BYA)" has a `⤵` decomposition affordance — visually distinct from the "appears in" lateral link (IA [00](00-ia-route-model.md) §5.2 rule 2 — containment vs. decomposition are different affordances).
3. **Activate zoom-in.** User clicks `⤵` → navigates to `/:username/timelines/evolution-of-life`. State transition: `fractal-zoom` (zoom in; the canvas origin is the event's position). Breadcrumb appends: _"Cosmic history ▸ Evolution of life on Earth"_ (level 2).
4. **Canvas re-renders at sub-timeline scope.** Events specific to this sub-timeline appear (Cambrian explosion, first cells, etc.) at their own temporal scale. Scale mode is inherited from the parent unless overridden by `?scale=`.
5. **Drill deeper.** "Cambrian explosion" also has a `⤵`. User activates → `/:username/timelines/cambrian-detail`. Breadcrumb: _"Cosmic history ▸ Evolution of life ▸ Cambrian detail"_ (level 3). State transition: `fractal-zoom`.
6. **Navigate up one level.** User clicks _"Evolution of life on Earth"_ in the breadcrumb → canvas loads that sub-timeline. State transition: `fractal-zoom` (zoom out, spatial reverse). Breadcrumb shortens to level 2.
7. **Jump directly to root.** User clicks _"Cosmic history"_ (root segment) in breadcrumb → canvas loads root timeline. `fractal-zoom` (zoom out to root). Breadcrumb collapses to one segment.
8. **Deep-zoom reset shortcut.** A **Reset zoom** control (exact placement owned by #171) returns the reader to the root timeline in one action from any depth. Same outcome as step 7 via shortcut.
9. **URL state.** Each zoom level is a distinct `/:username/timelines/:slug` URL so the browser back button traverses zoom history correctly. `?at=<sort_order_anchor>` deep-links to a specific scroll/zoom position; if the anchored event is no longer published the reader loads the root timeline position gracefully.

### Edge cases & recovery

| Scenario                                                 | Recovery                                                                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Sub-timeline has no events yet                           | Empty canvas with the sub-timeline's span; "No events in this sub-timeline" empty state (§3)                                     |
| Sub-timeline event is also a drill-in (cycle prevention) | The service layer and `detail_timeline_id` assignment prevent cycles (admin Flow G); the reader never encounters one             |
| Very deep stack (5+ levels)                              | Breadcrumb truncates middle levels with a `…` expand indicator; full stack accessible via `…` (interaction detail owned by #171) |
| `?at=` anchor points to an unpublished event             | Timeline loads at root position; no error surfaced                                                                               |
| Connection loss mid-drill                                | "Live updates paused" banner on the sub-timeline canvas; auto-resubscribe (§3)                                                   |

### Keyboard-only variant

Tab to the `⤵` affordance on an event → Enter to drill in. Tab to breadcrumb segments → Enter to jump level. Tab to **Reset zoom** control → Enter. Each zoom level is a normal page navigation so browser back/forward work. Focus moves to the canvas on arrival.

### Reduced-motion variant

All `fractal-zoom` transitions: instant canvas load at the new scope. No spatial fly-through or camera-pan animation at any level. Breadcrumb updates synchronously. Reset zoom: instant load of root timeline.

---

## F3 — Story-first: browse → filter → read → event reconvergence

**Persona:** A casual reader who wants to read "The Curies' Quest," a narrative third-person story, and then explores one of its events on the timeline canvas.

> **Implementation note:** narrative ordering of events within a story (`story_events.sort_order`) depends on [#183](https://github.com/shaes-farm/time-traveler/issues/183). Until that ships, events render in chronological fallback order and the drag-reorder affordance is hidden. The rest of this flow is unaffected.

### Steps

1. **Land on `/`**. User clicks **Stories** from the hero dual-CTA or top nav → `/stories` (Story browser, screen 4). State transition: `context-shift`.
2. **Story browser loads.** Filterable story grid with facet rail. User applies `?narrator=third_person` + `?tag=triumph`. Grid re-fetches (skeleton). URL becomes `/stories?narrator=third_person&tag=triumph`.
3. **Select a story.** User clicks "The Curies' Quest" → `/:username/stories/the-curies-quest`. State transition: `cross-fade` (content swap, not spatial — the reader is moving from a list to a reading surface, not changing temporal scale).
4. **Story reader loads** (Story reader, screen 5). Content: long-form prose column, ordered event rail (narrative order per `story_events.sort_order`), perspective-character chip "Marie Curie · Human" (icon + type label per IA §5.2 rule 3), narrator-type badge "Third person".
5. **Read and follow an event anchor.** The event rail shows "Discovery of polonium [1898 CE]" (era + precision always present, IA §5.2 rule 4). User clicks it → `/:username/events/discovery-of-polonium`. State transition: `context-shift`.
6. **Event detail loads** (Event detail, screen 6). "Appears in" section lists both the story and the "Curie biography" timeline. User clicks the timeline link → `/:username/timelines/curie-biography`. State transition: `fractal-zoom` (entering the spatial canvas).
7. **Reconvergence.** The reader is now on the timeline-first surface having arrived via story → event → timeline (IA [00](00-ia-route-model.md) §5.3). The zoom-stack breadcrumb reads _"Curie biography"_; the canvas is positioned at the event's temporal location if `?at=` is included in the link.

### Edge cases & recovery

| Scenario                                         | Recovery                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Story facets return no results                   | "No stories match your filters" + **Clear filters** affordance; facets stay in URL (§3)                                         |
| Story has no ordered events yet (valid)          | Prose-only render; no event rail appears — this is a valid story state (§3)                                                     |
| `story_events.sort_order` not yet shipped (#183) | Events render chronologically; a note in the event rail reads "Events shown in chronological order"; no drag-reorder affordance |
| Perspective character unpublished                | Character chip renders as inert text; no 404 (IA §5.2 rule 1)                                                                   |
| Story author adds a new event mid-read           | `ambient-presence` signal appears (unobtrusive); reader can continue or refresh to see the updated event list (§3)              |
| Connection loss mid-read                         | Stale-content banner + auto-resubscribe; prose already rendered remains readable (SSR content available, §3)                    |
| "Appears in" timeline is unpublished             | Timeline cross-link renders as inert text (IA §5.2 rule 1)                                                                      |

### Keyboard-only variant

Tab through `/stories` facet rail → Space to toggle. Tab through story cards → Enter to open. Tab through prose and event-rail anchors (perspective-character chip, event links, cross-links) → Enter to follow. Skip-to-content link available in the shell (screen 0, §2).

### Reduced-motion variant

Step 1 (`context-shift` to story browser): instant. Step 3 (`cross-fade` to story reader): instant content swap, no opacity transition. Step 5 (`context-shift` to event detail): instant. Step 6 (`fractal-zoom` to timeline canvas): instant canvas load, no spatial fly-through. `ambient-presence` update signal: text-only, no animation.

---

## F4 — Cross-link pivot and reconvergence between entry paths

**Persona:** A reader who arrived via the story-first path pivots through a character profile, continues to an event, and ends up on the timeline canvas — demonstrating the full reconvergence model.

### Steps

1. **Reading `/:username/stories/the-curies-quest`** (Story reader, screen 5). Perspective-character chip shows "Marie Curie · Human" (icon + type + name — never icon-alone, IA §5.2 rule 3).
2. **Open character profile.** User clicks "Marie Curie" chip → `/:username/characters/marie-curie`. State transition: `context-shift`.
3. **Character profile loads** (Character profile, screen 7). Content: type-identity header (Human icon, "Human" label, name), biography, temporal scope (birth/death with `TemporalDisplay`, era + precision, IA §5.2 rule 4), character timeline (events in role order), relationship network.
4. **Follow an event in the character timeline.** The character timeline section lists "Discovery of polonium [1898 CE, exact]" as an event where Marie participated. User clicks it → `/:username/events/discovery-of-polonium`. State transition: `context-shift`.
5. **Event detail shows cross-links.** "Appears in" section: "Curie biography" (timeline) and "Women in science comparative" (timeline) are both listed. "Participants" section includes Pierre Curie and Marie Curie as typed links.
6. **Pivot to timeline canvas.** User clicks "Curie biography" in "Appears in" → `/:username/timelines/curie-biography`. State transition: `fractal-zoom`. Breadcrumb: _"Curie biography"_.
7. **Timeline canvas is now in context.** The reader who began in a story has arrived at the timeline-first surface. From here they can zoom into events, follow period bands (#69), and drill into sub-timelines (F2). The pivot is complete; the reader is oriented.
8. **Optional lateral continuation.** From the event detail at any point, the reader can also click a participant (Pierre Curie) → his character profile → his separate set of events and relationships — all lateral `context-shift` moves, all maintaining era + precision on every temporal display.

### Edge cases & recovery

| Scenario                                          | Recovery                                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Character has no events in role order             | Character timeline section shows "No events yet" and omits the section gracefully (§3)                                                                 |
| Character has no published relationships          | Relationship network section omits gracefully (§3)                                                                                                     |
| Relationship network has many nodes               | Bounded render; paging or detail-on-demand strategy owned by #171                                                                                      |
| "Appears in" timeline is unpublished              | Timeline link renders as inert text; user is not confused by a dead link (IA §5.2 rule 1)                                                              |
| Event participants include unpublished characters | Participant link renders as inert text with the character's display name if available                                                                  |
| Era + precision missing from a date               | Should not occur — IA §5.2 rule 4 requires era + precision to travel with every temporal display; this is a data-quality concern to flag to the author |

### Keyboard-only variant

Tab through story-reader chrome to character chip → Enter. Tab through character profile sections (biography, character timeline list, relationship network nodes) → Enter to follow links. Tab through event-detail sections (participants, "appears in") → Enter. Focus management: on each navigation the focus moves to the main content region (skip-to-content link available).

### Reduced-motion variant

All `context-shift` transitions: instant. `fractal-zoom` to canvas: instant canvas load. Character profile, event detail, and timeline canvas sections render without entrance animations. Character-type identity header appears statically.

---

## F5 — Comparative viewer: align two timelines

**Status: MVP-optional (stretch).** This flow is in scope only if the `/compare` route is built for the initial release. It is documented here for completeness; if `/compare` is deferred, F1–F4 and F6 are unaffected.

**Persona:** A researcher who wants to compare two timelines — "Curie biography" and "Women in science" — on a shared temporal axis.

### Steps

1. **On `/explore`** (Timeline navigator, screen 2). User locates "Curie biography" and sees an **Add to compare** affordance on the card (checkbox or button). User activates it — the card enters a "selected" state.
2. **Select a second timeline.** User locates "Women in science" and activates its **Add to compare** affordance. A **Compare (2)** floating affordance or persistent control becomes active.
3. **Open comparative viewer.** User activates **Compare** → `/compare?t=username%2Fcurie-biography&t=username%2Fwomen-in-science`. State transition: `context-shift`. (Up to 4 timelines can be added; this flow uses 2.)
4. **Comparative viewer loads** (Comparative viewer, screen 9). Two aligned tracks, each a renderer instance (#65). A single shared time axis spans both tracks. Scale defaults to `?scale=logarithmic`; the URL carries it.
5. **Explore the aligned view.** Events that appear in both timelines via the `timeline_events` junction are highlighted with a shared-event indicator (design detail owned by #172). User zooms on the shared axis → both tracks zoom in sync. Scale changes propagate to both tracks.
6. **Toggle scale.** User switches to `?scale=linear` via the shared scale toggle. URL updates; both tracks re-render.
7. **Remove a track.** User clicks **×** on the "Women in science" track header → track disappears. With fewer than 2 tracks, the viewer shows the single-track "Add a timeline to compare" prompt (§3 comparative viewer empty state).
8. **Add a replacement.** User activates **+ Add timeline** → search picker of published timelines → selects "French scientists" → track appears, axis re-aligns.

### Edge cases & recovery

| Scenario                                                 | Recovery                                                                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fewer than 2 tracks on load (startup state)              | "Add at least 2 timelines to compare" prompt with a picker; no axis renders until 2 tracks are selected (§3)                                       |
| One track's timeline becomes unavailable mid-session     | That track shows a per-track error state ("This timeline is no longer available"); the other track continues unaffected (§3 per-track isolation)   |
| Scale conflict between timelines of very different spans | Log scale handles this gracefully; switching to linear with mismatched spans may compress one track's events — non-blocking, user intent respected |
| More than 4 timelines selected                           | The **Add to compare** affordance deactivates at 4 selected; a tooltip explains the limit (exact UX owned by #171)                                 |
| Connection loss                                          | Per-track stale indicator; per-track auto-resubscribe on reconnect (§3)                                                                            |

### Keyboard-only variant

Tab through explore grid → Space to activate **Add to compare** on each card. Tab to **Compare** control → Enter. Tab between tracks; Tab to scale toggle; keyboard zoom/pan on shared axis (owned by #171). Tab to add/remove track controls → Enter.

### Reduced-motion variant

`context-shift` to comparative viewer: instant. Per-track `fractal-zoom` on zoom: instant re-render at new scale. Shared-event highlights: static (no pulse or animation). Track add/remove: instant appearance.

---

## F6 — Period exploration: hierarchy, overlaid timelines, events in range

**Persona:** A palaeontology enthusiast exploring the Mesozoic Era period, drilling through the hierarchy, discovering overlaid timelines, and viewing computed events in range.

### Steps

1. **Entry from event detail.** User is on `/:username/events/cambrian-explosion` (Event detail, screen 6). The event has a "Part of period" section showing a "Cambrian" period band link.
2. **Open period detail.** User clicks "Cambrian" → `/:username/periods/cambrian`. State transition: `context-shift`.
3. **Period detail loads** (Period detail, screen 8). Content: period header "Cambrian" with `TemporalDisplay` span (538–485 MYA, era MYA, precision `approximate`). Hierarchy breadcrumb: _"Phanerozoic ▸ Paleozoic ▸ Cambrian"_. Overlaid timelines section lists "Evolution of life on Earth" (`period_timelines`). Events in range section: events whose dates fall within 538–485 MYA computed by date-range intersection with overlaid timelines.
4. **Navigate the hierarchy.** User clicks "Paleozoic" in the breadcrumb → `/:username/periods/paleozoic`. State transition: `context-shift`. Breadcrumb shortens: _"Phanerozoic ▸ Paleozoic"_. This period's events-in-range spans a wider temporal window (541–251 MYA).
5. **Follow an overlaid timeline.** On Paleozoic detail, the overlaid timelines section lists "Evolution of life on Earth". User clicks it → `/:username/timelines/evolution-of-life`. State transition: `fractal-zoom` (entering the canvas). Breadcrumb: _"Evolution of life on Earth"_.
6. **Return to the period from the timeline.** The timeline canvas may surface period bands as overlay layers (#69). User clicks the "Paleozoic" period band → `/:username/periods/paleozoic`. `context-shift`.
7. **Follow an event in range.** Back on Cambrian period detail, user clicks "Cambrian explosion [538 MYA, approximate]" in the events-in-range list → `/:username/events/cambrian-explosion`. `context-shift`. From event detail the reader can pivot back to the timeline canvas, closing the loop.

### Edge cases & recovery

| Scenario                                                      | Recovery                                                                                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Period has no overlaid timelines                              | Events-in-range computed from all published timelines (conservative fallback); "No timelines overlaid" noted in the overlaid timelines section                           |
| Period has no events in computed range                        | "No events in this period yet" empty state (§3)                                                                                                                          |
| Very deep hierarchy (4+ parent levels)                        | Breadcrumb truncates middle levels with `…` expand indicator; same pattern as F2 (detail owned by #171)                                                                  |
| Period span only partially overlaps an event's temporal range | Events-in-range is a span intersection, so partially-overlapping events appear; copy clarifies "overlapping this period" rather than "contained in" (copy owned by #171) |
| Period or overlaid timeline becomes unpublished mid-session   | Stale-content banner + resubscribe; unpublished items render as inert text in the lists (IA §5.2 rule 1)                                                                 |
| Hierarchy cycle (should not occur on the read path)           | The admin surface prevents cycles at write time (admin Flow K); the reader only reads the resulting hierarchy — no cycle is reachable                                    |

### Keyboard-only variant

Tab through event-detail "Part of period" links → Enter. Tab through period-detail breadcrumb links → Enter to navigate up hierarchy. Tab through overlaid timelines list → Enter to open canvas. Tab through events-in-range list → Enter to open event detail. Skip-to-content link available in shell.

### Reduced-motion variant

All `context-shift` transitions between period detail pages: instant. `fractal-zoom` to timeline canvas: instant load. Period detail sections appear without entrance animations. Period breadcrumb updates synchronously.

---

## Consolidated failure and recovery states

These states apply across all flows, derived from the per-screen states in [02](02-screen-inventory.md) §3.

| State                                      | Behavior                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unpublished / missing ref (404)**        | Any route whose entity is unpublished or does not exist returns a clean 404 page (screen 11); no 403 is ever surfaced (IA [00](00-ia-route-model.md) §4.3). In-page cross-links to unpublished entities render as inert text, not as dead links (§5.2 rule 1).                                                  |
| **Partial / sparse data (empty sections)** | Sections with no data (no participants, no relationships, no events in range) omit gracefully — no empty-bordered boxes. The entity page remains coherent without them (§3 sparse states).                                                                                                                      |
| **Connection loss — Realtime resubscribe** | A lightweight stale-content banner appears; the reader does not need to reload. Auto-resubscribe fires on reconnect; the visible data window re-fetches. SSR-rendered prose and entity content remains usable during the connection gap (§3). Full offline caching is out of scope.                             |
| **Transient error (non-404)**              | An inline retryable error region appears scoped to the affected section or screen; the rest of the shell remains usable.                                                                                                                                                                                        |
| **Implementation blockers**                | F2 drill-in is blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177) (`events.detail_timeline_id`). F3 narrative ordering is blocked on [#183](https://github.com/shaes-farm/time-traveler/issues/183) (`story_events.sort_order`). Both flows degrade gracefully until those columns ship. |

---

## Accessibility variants summary

All six flows support keyboard-only traversal and a reduced-motion mode. The principles underlying both are set in [01](01-ux-principles.md) §7; this table consolidates the per-flow notes.

| Variant            | Principle                                                                        | Consistent behavior across all flows                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keyboard-only**  | WCAG 2.1 AA; keyboard path for both entry spines                                 | Every interactive affordance reachable by Tab; Enter/Space to activate. Focus ring always visible. Skip-to-content link in the shell (screen 0). Focus moves to the main content region on each navigation. Exact key bindings for canvas zoom/pan, cluster expand, and graph navigation owned by #171.                                                                   |
| **Reduced-motion** | `prefers-reduced-motion: reduce` honored globally ([01](01-ux-principles.md) §7) | `fractal-zoom`, `context-shift`, `cross-fade`, `enter-exit`: all collapse to instant (or near-instant) state change — no spatial fly-through, no opacity transition, no camera pan. `ambient-presence`: drops all motion; live-update signal is text-only. Orientation (zoom-stack breadcrumb) is always present statically — no wayfinding depends on the animated path. |

---

## #65–#69 flow mapping

| Ticket | Visualization concern             | Flows          | Notes                                                                                                                                |
| ------ | --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| #65    | Renderer foundation               | F1, F2, F4, F5 | F1/F4: single renderer on the timeline reader (screen 3); F2: renderer used at each zoom level; F5: one renderer instance per track. |
| #66    | Logarithmic scale                 | F1, F5         | `?scale=logarithmic` is the default in F1 (long-span); shared across tracks in F5.                                                   |
| #67    | Linear mode + toggle              | F1, F5         | Same `?scale=` param carries `linear`; F5 applies the shared scale toggle across all tracks simultaneously.                          |
| #68    | Fractal zoom navigation           | F2             | `detail_timeline_id` drill, zoom-stack breadcrumb state, and deep-zoom reset are F2-specific; all depend on #177.                    |
| #69    | Period / character overlay layers | F1, F6         | F1: period bands surface on the canvas (step 6 cluster context); F6: period bands on the canvas link back to period detail (step 6). |

**Gating reminder** ([00](00-ia-route-model.md) §6, [02](02-screen-inventory.md) §5): #65–#67 must not begin implementation until the interaction spec (#171) and mid-fidelity spec (#172) land; #68–#69 additionally require prototype-validation findings (#173). These flows supply the narrative contract those specs refine — they do not themselves unblock implementation.

---

## What these flows do not cover

- **Sign-in / auth flows.** The reader is anonymous; no authentication is required or surfaced (PRD §2.3.2). A "Sign in" link deep-links out to the admin/auth surface — that flow is an admin concern.
- **Global search detailed flow.** `/search` (screen 10) is stubbed at launch; its full-text retrieval and result-page flow are deferred post-MVP.
- **Realtime co-presence UX.** Supabase Realtime is in scope for published-content updates but no author-presence or cursor-sharing UX is designed this pass.
- **Bulk operations.** No multi-select, bulk compare-add, or export flows.
- **Admin authoring paths.** Create / edit / publish / collaborate flows are fully separate and documented in [`docs/design/admin/01-user-flows.md`](../admin/01-user-flows.md).

---

## Handoff

| Issue | Artifact                     | Consumes from these flows                                                                                                                                                                      |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #170  | Low-fidelity wireframes      | F1–F6 step sequences as the frame-by-frame storyboard for each screen; edge-case states as the additional frames; flow IDs as references in annotations                                        |
| #171  | Interaction specification    | Keyboard paths, cluster-expand affordance, canvas key bindings, zoom-stack breadcrumb truncation model, graph-layout strategy for character network; all explicitly flagged here as #171-owned |
| #172  | Mid-fidelity + motion + a11y | Motion-class assignments per step (fractal-zoom, context-shift, cross-fade, enter-exit, ambient-presence); reduced-motion collapse rules; stale-content banner copy + placement                |
| #173  | Prototype validation         | F1–F4 + F6 (MVP floor) as the end-to-end scenarios for prototype testing; F5 if `/compare` is built                                                                                            |

---

## Verification (issue #169 acceptance criteria)

- [x] **At least 5 canonical reader flows documented** — F1 (timeline-first discover→inspect), F2 (fractal deep zoom + return), F3 (story-first browse→read→reconvergence), F4 (cross-link pivot), F5 (comparative viewer, MVP-optional), F6 (period exploration) — six flows total.
- [x] **Flow steps include state changes and navigation transitions** — each step names the motion class or navigation action; state at each screen noted (loading skeleton, facets active, canvas hydrating, etc.).
- [x] **Edge cases and recovery paths documented** — per-flow edge-case table; plus the [consolidated failure and recovery states](#consolidated-failure-and-recovery-states) section covering 404, sparse data, connection-loss, transient errors, and implementation blockers.
- [x] **Keyboard-only and reduced-motion variants captured** — per-flow sections plus the [accessibility variants summary](#accessibility-variants-summary) table.
- [x] **Flow artifacts are sufficient to drive wireframe production** — numbered steps per flow map directly to wireframe frames; edge cases map to additional state frames; [02](02-screen-inventory.md) §2 provides the screen-level module list; the handoff table is explicit.

**Verification checks (from #169):**

- [x] **Flows referenced by wireframe and interaction-spec issues** — [Handoff](#handoff) table maps each of #170–#173 to the flow sections they consume.
- [x] **Flow IDs map to acceptance criteria in #65–#69** — [#65–#69 flow mapping](#6569-flow-mapping) table with per-ticket hosting flows and notes.

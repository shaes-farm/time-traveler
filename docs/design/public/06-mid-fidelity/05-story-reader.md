# 05 — Story Reader (mid-fidelity)

Builds on: [04 wireframe — Story reader](../04-wireframes/05-story-reader.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/:username/stories/:slug` · Flows: F3, F4 ([03](../03-user-flows.md))

**Purpose.** Read long-form narrative prose with its ordered events in story context (`story_events.sort_order`, [#183](https://github.com/shaes-farm/time-traveler/issues/183)). The reading-first surface — prose is the primary object ([01 §3](../01-ux-principles.md)). Structure from the [04 wireframe](../04-wireframes/05-story-reader.md).

## Visual hierarchy + token callouts

- **Prose column:** **Body L** (Inter Tight 1.125rem / 1.7), constrained to **60–75ch** measure ([01 §5](../01-ux-principles.md)); Display L/M (Fraunces) headings; generous vertical rhythm. Chrome recedes — the timeline is context, not competition ([01 §3.1](../01-ux-principles.md)).
- **Perspective-character chip** ([01 §3.2](../01-ux-principles.md)): persistent quiet cue (type icon + name + type label), links to character profile.
- **Narrator-type badge:** Body S, quiet.
- **Ordered event rail:** events in narrative order; each shows `TemporalDisplay` (era + precision always present, [00 §5.2 rule 4](../00-ia-route-model.md)) + title; inline anchors in the prose link to the same events. Narrative order ≠ temporal order — the visual language must not let the reader confuse them ([01 §3.3](../01-ux-principles.md)).
- **Media:** images carry `alt_text`; lightbox on activation.

## Component states

| Module              | States                                                             |
| ------------------- | ------------------------------------------------------------------ |
| Event-rail item     | default · hover · focus-visible · current (in-view sync, optional) |
| Inline event anchor | default · hover · focus-visible                                    |
| Perspective chip    | link when published · inert when not                               |
| Media thumb         | default · hover · focus-visible · open (lightbox)                  |

## System states

- **Empty** (no ordered events, valid): prose-only render; no rail ([02 §3](../02-screen-inventory.md)).
- **`sort_order` not yet shipped (#183):** chronological fallback + note "Events shown in chronological order"; no reorder affordance (F3 edge case).
- **Loading:** prose + event-rail skeletons.
- **Error:** retryable; already-loaded prose stays readable (SSR).
- **Connection-loss:** stale banner; prose remains readable ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** prose column centered, event rail as a side rail. **Tablet:** rail moves below or to a disclosure. **Mobile:** single column — prose then events; inline anchors remain ([04](../04-wireframes/05-story-reader.md)).

## Motion

- **`context-shift`** following an event/character link; **`fractal-zoom`** when pivoting to a timeline canvas via an event; **`enter-exit`** media lightbox; **`ambient-presence`** new-event signal (text-only). **Reduced-motion:** all instant; new-event signal static ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                                                        |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → `h1` story title → narrator badge → perspective chip → prose (with inline anchors in reading order) → event rail → footer |
| 2   | Reading measure  | 60–75ch prose measure for legibility ([01 §5](../01-ux-principles.md))                                                                      |
| 3   | Temporal SR      | event anchors read era + precision (_"approximately…"_) not bare number ([accessibility-spec §4.4](accessibility-spec.md))                  |
| 4   | Media            | images expose `alt_text` (PRD §4.8.6); lightbox focus-trapped, Escape closes                                                                |
| 5   | Never color-only | perspective/narrator carry icon + label                                                                                                     |
| 6   | Reduced-motion   | lightbox + pivots instant ([motion-spec §5](motion-spec.md))                                                                                |

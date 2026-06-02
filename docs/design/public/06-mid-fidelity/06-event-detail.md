# 06 — Event Detail (mid-fidelity)

Builds on: [04 wireframe — Event detail](../04-wireframes/06-event-detail.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/:username/events/:slug` · Flows: F1, F3, F4, F6 ([03](../03-user-flows.md))

**Purpose.** Full event reader view (PRD §2.2.4) — a shared leaf where both entry spines reconverge ([00 §5.3](../00-ia-route-model.md)). Same chrome + affordances regardless of entry path ([01 §3.4](../01-ux-principles.md)). Structure from the [04 wireframe](../04-wireframes/06-event-detail.md).

## Visual hierarchy + token callouts

- **Header:** Display L title; `TemporalDisplay` range (era code mono + value + precision qualifier in `--color-foreground-muted`, [01 §4.1](../01-ux-principles.md)); type + importance badges (★ ramp, `--color-importance-*` + value).
- **Location / categories:** Body M; category links resolve to `/explore?category=…` ([00 §3.3](../00-ia-route-model.md)).
- **Participants** (`event_characters`): typed character links (icon + name + type label); inert text when unpublished.
- **Cross-links:** "Appears in" timelines/stories; "Zoom into ⤵" when `detail_timeline_id` (#177) — distinct decomposition affordance; "Return to story" when arriving with `?from=story` return context ([05 §9.2](../05-interaction-specification.md)).
- **Sparse handling:** empty sections omit gracefully — no empty-bordered boxes ([02 §3](../02-screen-inventory.md)).

## Component states

| Module           | States                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Participant link | link · inert (unpublished) · focus-visible                                           |
| Appears-in link  | link · inert · focus-visible                                                         |
| Zoom-into `⤵`    | present (when `detail_timeline_id`) · absent · focus-visible (BLOCKED #177)          |
| Return-to-story  | shown only with story return context ([05 §9.2](../05-interaction-specification.md)) |
| Media thumb      | default · hover · focus-visible · open (lightbox)                                    |

## System states

- **Sparse** (no participants/categories): sections omit gracefully ([02 §3](../02-screen-inventory.md)).
- **Loading:** section skeletons.
- **Missing/unpublished:** clean 404 ([11](11-not-found.md)); transient errors retryable.
- **Connection-loss:** stale banner; resubscribe ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** header + two-column body (content / meta sidebar). **Tablet:** sidebar folds under content. **Mobile:** single column, sections stacked ([04](../04-wireframes/06-event-detail.md)).

## Motion

- **`context-shift`** to participants/period/timeline lateral moves; **`fractal-zoom`** entering a timeline canvas via "appears in"/`⤵`; **`enter-exit`** media lightbox; **`ambient-presence`** stale banner. **Reduced-motion:** all instant ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                                                   |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → `h1` event title → temporal/badges → body sections (location → participants → categories → appears-in/zoom) → footer |
| 2   | Temporal SR      | range read with era + precision ([accessibility-spec §4.4](accessibility-spec.md))                                                     |
| 3   | Return context   | "Return to story" reachable + restores rail focus at `storyPos` ([05 §9.2](../05-interaction-specification.md))                        |
| 4   | Never color-only | type/importance carry label + ★/value; participants carry type label                                                                   |
| 5   | Dead links       | unpublished refs render inert text, never dead links ([00 §5.2 rule 1](../00-ia-route-model.md))                                       |
| 6   | Reduced-motion   | lateral moves + canvas entry instant ([motion-spec §5](motion-spec.md))                                                                |

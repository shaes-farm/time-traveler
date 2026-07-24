# TimelineRenderer — performance baseline (#65)

Acceptance criterion for #65: _"Performance baseline is measurable and documented."_
This records the method and the initial numbers so later scale/zoom/virtualization
tickets (#66, #68) have a reference point.

## What #65 does (and does not) do

The foundation renderer draws **every** event as an SVG `<g>` marker — there is no
virtualization, semantic-level culling, or clustering yet (those arrive with the
scale/zoom tickets #66/#68, keyed off the label-density ceilings in
`docs/design/public/05-interaction-specification.md`). So these numbers are the
_upper bound_ for a given event count: the cost of mounting N full markers.

## Method

Rendered the synthetic set from the `PerformanceBaseline` Storybook story
(`Math.round(-13.8e9 * (1 - i/n)^6)`, a Big-Bang-weighted spread) at a fixed
1200px width and timed `render()` with `performance.now()` under the package's
jsdom + React Testing Library harness (Node, `vitest`). Reproduce by temporarily
adding a timed `render()` around `TimelineRenderer` and running with
`vitest run --disable-console-intercept`.

## Baseline numbers (jsdom harness)

| Events | Render (mount) |
| -----: | -------------: |
|    127 |        ~109 ms |
|    500 |        ~188 ms |
|  1,000 |        ~299 ms |

**Caveat:** jsdom does no layout/paint, so these track React reconciliation +
DOM-node construction, not on-screen frame cost. A real browser paints SVG
differently (and the first sample includes cold JIT). Treat the table as a
regression tripwire for the mount path, not a field FPS measurement.

## Relation to PRD budgets

PRD §6953–6955 targets: `<100` events instant (`<100ms`), `100–1000` events
`<500ms`, `1000+` progressive rendering with a loading indicator. The ~127-event
typical timeline (PRD §5854) mounts comfortably inside the `<500ms` band. The
`1000+` progressive-rendering path and the Canvas fallback for `>5000` events
(PRD §5488) are explicitly out of scope for #65 and are handled by #66/#68 and a
future fallback renderer — cheap to add because the scale math in
`timeline-scale.ts` is renderer-agnostic (ADR-0039).

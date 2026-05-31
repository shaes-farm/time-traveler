# Public Reader Design Artifacts

Design-first workstream for the **public-facing reader experience** (timeline navigator + story browser), kept deliberately distinct from the admin CMS design under [`docs/design/admin/`](../admin/).

- **Epic:** [#165 — Public Reader UX Design Artifacts for Timeline Navigator + Story Browser](https://github.com/shaes-farm/time-traveler/issues/165)
- **Audience separation:** the admin surface is a dense, keyboard-first authoring CMS (Notion/Linear/Sanity register — see [`docs/design/admin/03-aesthetic-notes.md`](../admin/03-aesthetic-notes.md)). The public reader is an immersive, exploratory consumption surface. These two surfaces **share design tokens but diverge sharply in motion and composition** (admin's own aesthetic notes call this out under _What would change my mind_).

## Artifact index

| #   | Artifact                                   | Issue                                                          | Status |
| --- | ------------------------------------------ | -------------------------------------------------------------- | ------ |
| 00  | [IA + route model](00-ia-route-model.md)   | [#166](https://github.com/shaes-farm/time-traveler/issues/166) | draft  |
| 01  | UX principles + visual direction           | [#167](https://github.com/shaes-farm/time-traveler/issues/167) | todo   |
| 02  | Screen inventory + scope map               | [#168](https://github.com/shaes-farm/time-traveler/issues/168) | todo   |
| 03  | User flows                                 | [#169](https://github.com/shaes-farm/time-traveler/issues/169) | todo   |
| 04  | Low-fidelity wireframes                    | [#170](https://github.com/shaes-farm/time-traveler/issues/170) | todo   |
| 05  | Interaction specification                  | [#171](https://github.com/shaes-farm/time-traveler/issues/171) | todo   |
| 06  | Mid-fidelity + motion + accessibility spec | [#172](https://github.com/shaes-farm/time-traveler/issues/172) | todo   |
| 07  | Prototype validation + readiness           | [#173](https://github.com/shaes-farm/time-traveler/issues/173) | todo   |

## Sequencing

These artifacts are a hard-chained dependency line (each feeds the next) per the [#165 execution runbook](https://github.com/shaes-farm/time-traveler/issues/165). They gate the timeline-visualization implementation tickets:

- **#65–#67** must not start implementation until the interaction spec (#171) and mid-fidelity spec (#172) are complete.
- **#68–#69** additionally require the prototype-validation findings (#173).

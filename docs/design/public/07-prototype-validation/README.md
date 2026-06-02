# Public Reader — Prototype Validation + Implementation Readiness

Status: **draft 1** — the prototype clickthrough, the heuristic + cognitive-walkthrough validation, and the GO/NO-GO readiness gate for timeline-visualization implementation.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#173](https://github.com/shaes-farm/time-traveler/issues/173)
Builds on: [00 IA](../00-ia-route-model.md) · [01 UX principles](../01-ux-principles.md) · [02 screen inventory](../02-screen-inventory.md) · [03 user flows](../03-user-flows.md) · [04 wireframes](../04-wireframes/) · [05 interaction spec](../05-interaction-specification.md) · [06 mid-fidelity](../06-mid-fidelity/)

> **What this artifact is.** Artifact **07** — the final link in the [#165](https://github.com/shaes-farm/time-traveler/issues/165) chain and the last gate before [#65–#69](https://github.com/shaes-farm/time-traveler/issues/65) may begin. It (a) wires the existing comps into a navigable **prototype clickthrough**, (b) **validates** the core journeys by heuristic evaluation + cognitive walkthrough, and (c) issues an explicit **GO/NO-GO** with prioritized, issue-mapped recommendations.
>
> **What this artifact is not.** Not production code (out of scope per #173; `apps/reader` is unbuilt until #65, [ADR-0030](../../../adr/adr-0030-public-reader-app-placement.md)), not Figma comps, and not new specs — it **validates and routes** the existing 00–06 artifacts rather than adding design surface.

## Format + method decisions

- **Prototype = navigable markdown wireflow.** The whole epic is markdown-only ([06 README "Format (no Figma)"](../06-mid-fidelity/README.md)); the "clickable prototype" is therefore a link-traversable node graph over the existing comps — see [00-prototype-wireflow.md](00-prototype-wireflow.md). This satisfies "prototype demonstrates core navigation and transition behaviors" without building the unbuilt reader app.
- **Validation = expert review** (heuristic evaluation + cognitive walkthrough), not moderated user sessions — appropriate for a solo/small-team project and explicitly permitted by #173 ("/ heuristic review").

## Contents

| File                                                 | Purpose                                                                                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [00-prototype-wireflow.md](00-prototype-wireflow.md) | The clickable prototype: a node graph + click paths over the 06 comps, covering the primary timeline and story-browser journeys, scale toggle, fractal drill, plus keyboard + reduced-motion traversal. |
| [01-validation-report.md](01-validation-report.md)   | Heuristic evaluation (Nielsen's 10) + cognitive walkthrough of flows F1–F4 + F6 leaf; severity-rated findings register (0–4) and top risks.                                                             |
| [02-readiness.md](02-readiness.md)                   | Recommendations mapped to concrete issue/doc updates; #65–#69 prerequisite changes; explicit GO/NO-GO gate + verdict.                                                                                   |

## Headline outcome

**GO — with two conditions** ([02 §3.3](02-readiness.md#33-verdict)): 0 catastrophe-severity findings; the two major findings (drill-in discoverability, canvas learnability) are implementation-time affordance additions, not design rework. Conditions: (1) sequence the motion-token ticket (R-X1) before/with #65; (2) accept V-01/V-02 as P0 scope on #65/#68. The schema blocker [#177](https://github.com/shaes-farm/time-traveler/issues/177) is closed, so #68–#69 are also cleared.

## Verification (issue #173 acceptance criteria)

- [x] **Prototype demonstrates core navigation and transition behaviors** — [00-prototype-wireflow.md](00-prototype-wireflow.md) (paths 1–4 + branches; transitions cite [motion-spec](../06-mid-fidelity/motion-spec.md)).
- [x] **Validation report captures top usability risks and severity** — [01-validation-report.md](01-validation-report.md) §1–§2 (Nielsen 0–4 scale).
- [x] **Recommendations are mapped to concrete issue updates** — [02-readiness.md](02-readiness.md) §1.
- [x] **Required changes to #65–#69 prerequisites are identified** — [02-readiness.md](02-readiness.md) §2 (R-68a unblocked + new per-ticket prerequisites).
- [x] **Go/no-go criteria for starting visualization implementation are explicit** — [02-readiness.md](02-readiness.md) §3.

**Verification checks (from #173):**

- [x] **Validation package is linked from epic #165** — performed as an issue comment on merge ([02 §4](02-readiness.md#4-artifacts-updated-in-this-pr)).
- [x] **Updated issue dependencies reflect findings** — R-68a status correction ([06 implementation-risks](../06-mid-fidelity/implementation-risks.md)) + per-ticket annotations ([02 §2b](02-readiness.md#2b-new-validation-driven-prerequisites)).

# Public Reader — Validation Report

Status: **draft 1** — heuristic evaluation + cognitive walkthrough of the prototype wireflow, with severity-rated findings.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#173](https://github.com/shaes-farm/time-traveler/issues/173)
Method inputs: [00 prototype-wireflow](00-prototype-wireflow.md) · [03 user flows](../03-user-flows.md) · [05 interaction spec](../05-interaction-specification.md) · [06 motion-spec](../06-mid-fidelity/motion-spec.md) · [06 accessibility-spec](../06-mid-fidelity/accessibility-spec.md)

> **Method.** This is an **expert review**, not moderated user sessions — appropriate for a solo/small-team project and explicitly permitted by #173 ("lightweight usability sessions / heuristic review"). Two complementary techniques were run against the [prototype wireflow](00-prototype-wireflow.md):
>
> 1. **Heuristic evaluation** — Nielsen's 10 usability heuristics applied to each node and transition.
> 2. **Cognitive walkthrough** — for the MVP-floor flows (F1–F4 + the F6 leaf), the four learnability questions (Wharton et al.) at each step: _will the reader (a) form the right goal, (b) notice the correct action, (c) connect the action to the effect, (d) see progress after acting?_
>
> **Severity scale (Nielsen 0–4):** 0 not a problem · 1 cosmetic · 2 minor · 3 major (fix before/with implementation) · 4 catastrophe. Each finding cites the artifact that originates the risk. Mitigations and issue routing are in [02-readiness.md](02-readiness.md).

---

## 1. Findings register

| ID   | Location                     | Heuristic(s)                         | Finding                                                                                                                                                                                                                                             | Sev | Evidence                                                                                                                                                                                                             |
| ---- | ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | N3 drill-in `⤵`              | H2 match · H6 recognition · H10 help | The fractal **drill-in** — the product's signature interaction — is a bare `⤵` glyph whose only distinction from the "appears in" lateral link is the glyph itself. New readers may never discover decomposition.                                   |  3  | [00 §5.2 rule 2](../00-ia-route-model.md); [03 F2 step 2](../03-user-flows.md#f2--fractal-deep-zoom--return--reset-context); [05 §8.1](../05-interaction-specification.md) defines behavior, not affordance labeling |
| V-02 | N3 canvas (first run)        | H10 help · H6 recognition            | The interaction-heavy canvas (zoom / scale toggle / drill) has **no visible first-run affordance hints** for sighted pointer users; the keyboard-help hint is SR-only via `aria-describedby`. The most novel surface is the least self-explanatory. |  3  | [05 §10.2](../05-interaction-specification.md) (help hint is `aria-describedby`); no onboarding in [03](../03-user-flows.md)/[06 03-timeline-reader](../06-mid-fidelity/03-timeline-reader.md)                       |
| V-03 | N3 scale toggle              | H2 match real-world                  | Scale-mode control labels **"Logarithmic" / "Linear"** are precise domain jargon; a general reader may not predict what toggling does to a billion-year view.                                                                                       |  2  | [05 §5.1](../05-interaction-specification.md); labels are the text layer per [a11y §6](../06-mid-fidelity/accessibility-spec.md)                                                                                     |
| V-04 | N3 entry / drill (1.3, 2.1)  | H1 status                            | The 480ms `fractal-zoom` is a **route navigation**; if the destination fetch outlasts the camera flight there is no specified progress signal during the gap between animation-end and data-ready.                                                  |  2  | [03 F1 step 5](../03-user-flows.md) ("skeleton hydrates progressively"); [motion §2.1](../06-mid-fidelity/motion-spec.md) (animation only) — handoff unspecified                                                     |
| V-05 | N3 zoom state                | H1 status · H6 recognition           | Current **semantic level + visible window** are announced to screen readers but not surfaced visually; sighted users have only the breadcrumb + axis labels to judge "how zoomed am I / what range am I seeing."                                    |  2  | [a11y §4.1](../06-mid-fidelity/accessibility-spec.md) (SR announces L0–L3 + window); no visual counterpart in [05 §6](../05-interaction-specification.md)                                                            |
| V-06 | N3 breadcrumb (depth ≥4)     | H6 recognition                       | At depth ≥4 the breadcrumb collapses middle segments into a `…` popover, turning wayfinding into recall + an extra action on deep stacks.                                                                                                           |  2  | [05 §8.3](../05-interaction-specification.md); [03 F2 deep-stack edge](../03-user-flows.md)                                                                                                                          |
| V-07 | N3 scale = linear, long span | H3 control · H8 minimalist           | Toggling **linear** on a cosmological span compresses geological events into an illegible pile; "non-blocking, user intent respected" leaves the only recovery as silently toggling back.                                                           |  2  | [05 §5.3](../05-interaction-specification.md); [03 F1 edge "Scale toggle … billion-year span"](../03-user-flows.md)                                                                                                  |
| V-08 | N3 `?at=` deep-link          | H1 status                            | An unresolved/unpublished `?at=` anchor loads the root "with no error surfaced" — safe, but the reader gets no hint why the link didn't land where it implied.                                                                                      |  1  | [03 F2 `?at=` edge](../03-user-flows.md); [05 §9.3](../05-interaction-specification.md)                                                                                                                              |
| V-09 | N3 cluster preview           | H7 efficiency                        | Large clusters page 25 at a time with "+N more" and no in-panel filter/search — locating one event in a 100+ cluster is slow.                                                                                                                       |  1  | [05 §7.2](../05-interaction-specification.md); [03 F1 "100+ events" edge](../03-user-flows.md)                                                                                                                       |
| V-10 | all routes, transient error  | H9 recovery                          | The "inline retryable error region" for non-404 transient errors has no pinned per-surface copy/affordance wording, risking inconsistent recovery messaging.                                                                                        |  1  | [05 §11](../05-interaction-specification.md); [03 consolidated states](../03-user-flows.md#consolidated-failure-and-recovery-states)                                                                                 |
| V-11 | N6 "Return to story"         | H3 control · H4 consistency          | The event header's **Return to story** action exists only with story return context; arriving at the same event by other paths shows a different header. Expected, but confirm it doesn't read as a broken/inconsistent affordance.                 |  1  | [05 §9.2](../05-interaction-specification.md)                                                                                                                                                                        |

**Distribution:** 0 catastrophes · 2 major (V-01, V-02) · 5 minor (V-03–V-07) · 4 cosmetic (V-08–V-11).

---

## 2. Top usability risks (by severity)

1. **V-01 — drill-in discoverability (major).** Fractal decomposition is the differentiating feature (PRD §2.2.2); if readers don't discover `⤵`, the product's core value is hidden. Highest-leverage fix.
2. **V-02 — canvas learnability (major).** The timeline reader is a novel, gesture-driven surface; without any visible affordance cue, first-time readers under-use zoom/scale/drill. Pairs with V-01.
3. **V-03 / V-05 / V-07 — scale-model legibility (minor cluster).** The log/linear model is powerful but under-explained (V-03), under-surfaced (V-05), and can self-trap (V-07). Together they're a coherent "make the temporal scale model legible" workstream.
4. **V-04 / V-06 (minor).** Status during zoom-fetch and deep-stack wayfinding — bounded, well-understood fixes.

No finding blocks the design from being implementation-ready; all are addressable as implementation annotations or small spec amendments ([02-readiness §1](02-readiness.md)).

---

## 3. Cognitive walkthrough — MVP-floor flows

Per step, only the questions that surfaced friction are noted; unmarked steps passed all four.

### F1 — discover → zoom → inspect ([Path 1](00-prototype-wireflow.md#path-1--timeline-first-discover--zoom--inspect-event-tag-f1))

- **1.3 card → canvas (Q4 progress):** see **V-04** — gap between 480ms flight and data-ready.
- **1.4 cluster expand (Q2 notice):** aggregate marker + count badge is a reasonable affordance ([05 §7.1](../05-interaction-specification.md)); **passes**, low risk.
- **Branch 1a scale toggle (Q3 connect):** see **V-03** — label jargon weakens the action→effect link for general readers.
- All other steps pass; facet persistence in URL (1.2) is a notable strength (Q4).

### F2 — fractal deep zoom + return ([Path 2](00-prototype-wireflow.md#path-2--fractal-deep-zoom--return-tag-f2-68))

- **2.1 drill-in `⤵` (Q2 notice + Q3 connect):** **V-01** — the make-or-break step. If `⤵` isn't noticed/understood, the entire flow is never entered.
- **2.3/2.4 breadcrumb jump + reset (Q1 goal, Q4 progress):** reset (`0`) and breadcrumb jumps are well-modeled and reversible — strong **user-control** story; deep-stack `…` is the only friction (**V-06**).

### F3 — story-first browse → read → reconverge ([Path 3](00-prototype-wireflow.md#path-3--story-first-browse--read--event-reconvergence-tag-f3))

- **3.3 list → reading (`cross-fade`):** clean; reading column + ordered rail is conventional — **passes**.
- **3.5 Return to story (Q2 notice):** **V-11** — confirm the conditional header reads consistently.
- **3.6 event → timeline (Q4 progress):** same `fractal-zoom` route-fetch handoff as V-04.

### F4 — cross-link pivot ([Path 4](00-prototype-wireflow.md#path-4--cross-link-pivot-tag-f4))

- All lateral `context-shift` pivots (chip → character → event → period) **pass** all four questions: typed links carry icon + label + name, and era + precision travel with every temporal value ([a11y §6](../06-mid-fidelity/accessibility-spec.md), [00 §5.2 rule 4](../00-ia-route-model.md)) — a consistency strength. Period leaf (F6) inherits the same.

---

## 4. Heuristic strengths confirmed (severity 0)

The review also confirms the design is **strong** on most heuristics — these support the GO verdict and should be protected during implementation:

- **H5 error prevention / H9 recovery:** clean **404, never 403** ([00 §4.3](../00-ia-route-model.md)); unpublished cross-links render as **inert text**, not dead links ([00 §5.2 rule 1](../00-ia-route-model.md)); invalid `?scale=` coerced; drill-in cycles prevented at write time.
- **H4 consistency:** scale control is a **radio group** (`aria-checked`), not a toggle button ([a11y §6](../06-mid-fidelity/accessibility-spec.md)); never-color-only audit covers all 12 screens.
- **H3 user control:** **reset zoom** + key `0`, back/forward replays the route stack, every zoom level is a shareable URL, facets persist in URL.
- **H1 status (realtime):** quiet, non-stealing stale banner with explicit copy + **Refresh** ([motion §3](../06-mid-fidelity/motion-spec.md)).
- **Accessibility floor:** input parity across mouse/touch/keyboard ([05 §10.4](../05-interaction-specification.md)); reduced-motion enforced once at the token layer ([motion §5](../06-mid-fidelity/motion-spec.md)); focus moves to destination `h1` on every navigation ([a11y §2.2](../06-mid-fidelity/accessibility-spec.md)).

---

## 5. Verification (validation-report portion of #173 AC)

- [x] **Validation report captures top usability risks and severity** — §1 register (0–4 Nielsen scale) + §2 ranked top risks.
- [x] **Findings traceable to artifacts** — every row cites its originating spec section.
- [x] **Core navigation + transition behaviors exercised** — cognitive walkthrough §3 over F1–F4 + F6 leaf against the [wireflow](00-prototype-wireflow.md).
- [x] **Recommendations mapped to issue updates** — see [02-readiness §1](02-readiness.md).

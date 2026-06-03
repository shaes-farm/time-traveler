# Public Reader — Implementation Readiness (recommendations + GO/NO-GO)

Status: **draft 1** — prioritized recommendations, prerequisite changes for #65–#69, and the explicit go/no-go gate.
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#173](https://github.com/shaes-farm/time-traveler/issues/173)
Builds on: [00 wireflow](00-prototype-wireflow.md) · [01 validation report](01-validation-report.md) · [06 implementation-risks](../06-mid-fidelity/implementation-risks.md)

> Closes the back half of #173: each [validation finding](01-validation-report.md#1-findings-register) is mapped to a **concrete issue/doc update**, the **#65–#69 prerequisite changes** are reconciled against the existing [implementation-risks](../06-mid-fidelity/implementation-risks.md) register, and an **explicit GO/NO-GO** gate is stated with the current verdict.

---

## 1. Prioritized recommendations → concrete updates

Priority: **P0** = address before/with the consuming ticket starts · **P1** = address within the consuming ticket · **P2** = backlog / nice-to-have.

| Finding                                                                 | Pri | Recommendation                                                                                                                                                                                                         | Concrete update (where it lands)                                                                                                                                                                          |
| ----------------------------------------------------------------------- | :-: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [V-01](01-validation-report.md#1-findings-register) drill-in            | P0  | Give `⤵` a **visible text/affordance label or persistent tooltip** ("Zoom into sub-timeline") and a distinct shape from "appears in"; add a discoverable cue on first encounter.                                       | Amend [06 03-timeline-reader.md](../06-mid-fidelity/03-timeline-reader.md) (drill affordance spec); annotate **#68**.                                                                                     |
| [V-02](01-validation-report.md#1-findings-register) canvas learnability | P0  | Add a **visible canvas help/affordance hint** for pointer users (e.g. a dismissible "scroll to zoom · double-click to drill" coachmark or a persistent help `?` button) in addition to the SR `aria-describedby` hint. | Amend [06 03-timeline-reader.md](../06-mid-fidelity/03-timeline-reader.md) + [05 §10.2](../05-interaction-specification.md); annotate **#65**.                                                            |
| [V-03](01-validation-report.md#1-findings-register) scale jargon        | P1  | Pair the log/linear control with **plain-language helper text** (e.g. "Even spacing" vs "Compressed for deep time") or an info tooltip; keep `aria-checked` radio semantics.                                           | Amend [05 §5.1](../05-interaction-specification.md) + [06 03-timeline-reader.md](../06-mid-fidelity/03-timeline-reader.md); annotate **#66/#67**.                                                         |
| [V-04](01-validation-report.md#1-findings-register) zoom-fetch status   | P1  | Specify the **animation↔fetch handoff**: canvas skeleton/progress shows if data isn't ready when the `fractal-zoom` settles.                                                                                           | Amend [05 §11](../05-interaction-specification.md) (loading) + [motion §2.1](../06-mid-fidelity/motion-spec.md); annotate **#65** (extends [R-65a](../06-mid-fidelity/implementation-risks.md)).          |
| [V-05](01-validation-report.md#1-findings-register) visual zoom state   | P1  | Surface the **semantic level + visible window** visually (small scale/range indicator), mirroring the SR announcement.                                                                                                 | Amend [06 03-timeline-reader.md](../06-mid-fidelity/03-timeline-reader.md); annotate **#66/#69**.                                                                                                         |
| [V-06](01-validation-report.md#1-findings-register) breadcrumb depth    | P2  | Confirm the `…` popover is keyboard-reachable + announced; consider always showing root + current.                                                                                                                     | Already specified ([05 §8.3](../05-interaction-specification.md), [a11y §2.2](../06-mid-fidelity/accessibility-spec.md)); annotate **#68** (extends [R-68b](../06-mid-fidelity/implementation-risks.md)). |
| [V-07](01-validation-report.md#1-findings-register) linear self-trap    | P2  | Optional **inline hint** when linear compresses a long span ("Events compressed — switch to logarithmic?"); non-blocking.                                                                                              | Amend [05 §5.3](../05-interaction-specification.md); annotate **#67** (extends [R-67a](../06-mid-fidelity/implementation-risks.md)).                                                                      |
| [V-08](01-validation-report.md#1-findings-register) silent `?at=`       | P2  | Optional one-line note when an anchor can't resolve ("Showing the full timeline").                                                                                                                                     | Amend [05 §9.3](../05-interaction-specification.md); annotate **#65/#68**.                                                                                                                                |
| [V-09](01-validation-report.md#1-findings-register) cluster search      | P2  | Backlog: add in-panel filter/search for very large clusters.                                                                                                                                                           | New follow-up issue; reference [R-69b](../06-mid-fidelity/implementation-risks.md).                                                                                                                       |
| [V-10](01-validation-report.md#1-findings-register) transient copy      | P2  | Pin per-surface transient-error copy + retry wording.                                                                                                                                                                  | Amend [02 §3](../02-screen-inventory.md) / [05 §11](../05-interaction-specification.md).                                                                                                                  |
| [V-11](01-validation-report.md#1-findings-register) return-to-story     | P2  | Confirm the event header reads consistently with/without return context (no orphaned slot).                                                                                                                            | Verify in [06 06-event-detail.md](../06-mid-fidelity/06-event-detail.md); annotate **#65**.                                                                                                               |

**Net:** two **P0** items (V-01, V-02), both implementation-time affordance additions on the timeline-reader surface — **not design blockers**. Everything else is P1/P2.

---

## 2. Required changes to #65–#69 prerequisites

Reconciled against the existing [implementation-risks register](../06-mid-fidelity/implementation-risks.md). Two kinds of change: **(a) status corrections** to existing risks, and **(b) new validation-driven prerequisites**.

### 2a. Status corrections

- **[R-68a] no longer BLOCKED.** [#177](https://github.com/shaes-farm/time-traveler/issues/177) (`events.detail_timeline_id`) is **CLOSED/merged**; the drill-in `⤵` (F2 / #68) is unblocked. The [03 F2 implementation note](../03-user-flows.md#f2--fractal-deep-zoom--return--reset-context) and [implementation-risks R-68a](../06-mid-fidelity/implementation-risks.md) must be updated from "BLOCKED" to "available." _(Done in this PR for implementation-risks; see [§4](#4-artifacts-updated-in-this-pr).)_

### 2b. New validation-driven prerequisites

| Ticket  | New prerequisite (from this validation)                                                                                | Source           |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| #65     | Visible canvas affordance/help cue (V-02); zoom↔fetch loading handoff (V-04); confirm event-header consistency (V-11). | V-02, V-04, V-11 |
| #66/#67 | Plain-language scale helper (V-03); visible scale/range indicator (V-05); linear-compression hint (V-07).              | V-03, V-05, V-07 |
| #68     | Labeled, discoverable drill-in affordance (V-01); breadcrumb `…` keyboard/SR check (V-06).                             | V-01, V-06       |
| #69     | Visible semantic-level/range indicator shares the overlay layer (V-05).                                                | V-05             |

### 2c. Pre-existing prerequisites that still gate (unchanged, carried from [implementation-risks](../06-mid-fidelity/implementation-risks.md))

- **[R-X1] Motion-token ticket must be sequenced before/with #65** — `--duration-*` / `--ease-*` don't exist in `@repo/ui` yet ([ADR-0032](../../../adr/adr-0032-public-reader-motion-tokens.md) scopes a downstream token ticket). **This is the one hard sequencing dependency** for starting #65.
- **[R-65b]** canvas focus model (roving tabindex vs. single canvas focus + virtual cursor) — decide in #65.
- **[R-X2]** reduced-motion collapses uniformly at the token layer; **[R-X3]** Realtime resubscribe must not lose viewport state.

---

## 3. GO / NO-GO gate for #65–#69

### 3.1 Gating model (carried from [00 §6](../00-ia-route-model.md), #165)

- **#65–#67** unblock on the interaction spec (#171) **+** mid-fidelity spec (#172).
- **#68–#69** additionally require **this** prototype-validation package (#173).

### 3.2 Readiness checklist

| Gate                                                              | Status | Note                                                                                    |
| ----------------------------------------------------------------- | :----: | --------------------------------------------------------------------------------------- |
| Interaction state machine + testable AC exist (#171)              |   ✅   | [05 §3, §12](../05-interaction-specification.md)                                        |
| Mid-fi comps + motion + a11y complete (#172)                      |   ✅   | [06 README](../06-mid-fidelity/README.md) (PR #201 merged)                              |
| Prototype demonstrates core nav + transitions (#173)              |   ✅   | [00 wireflow](00-prototype-wireflow.md)                                                 |
| Validation done; no catastrophe-severity findings                 |   ✅   | [01 §1](01-validation-report.md) — 0 sev-4, 2 sev-3 (both implementation-time)          |
| Schema blocker for drill-in resolved                              |   ✅   | [#177](https://github.com/shaes-farm/time-traveler/issues/177) closed (R-68a unblocked) |
| Motion-token ticket sequenced before/with #65 (R-X1)              |   ⚠️   | **Action required** — file/sequence the `@repo/ui` motion-token ticket                  |
| P0 findings (V-01, V-02) accepted as #65/#68 implementation scope |   ⚠️   | Annotated on tickets in [§1](#1-prioritized-recommendations--concrete-updates)          |

### 3.3 Verdict

**GO — with two conditions.**

The public-reader design is **implementation-ready**: the full artifact chain (00–06) is complete, the interaction contract is testable, the schema blocker is cleared, and validation surfaced **no catastrophe-severity issues**. The two major findings (V-01 drill-in discoverability, V-02 canvas learnability) are **affordance additions made during implementation**, not design rework — they are tracked as P0 scope on #65/#68.

**Conditions before #65 starts coding:**

1. **Sequence the motion-token ticket (R-X1)** so `fractal-zoom`/`context-shift` durations aren't hard-coded.
2. **Accept V-01 + V-02 as P0 scope** on #65 (canvas help cue) and #68 (labeled drill affordance).

With those two accepted, **#65–#69 are cleared to begin** (#65–#67 immediately; #68–#69 on the same gate now that #173 is satisfied and #177 is closed).

---

## 4. Artifacts updated in this PR

- [06 implementation-risks.md](../06-mid-fidelity/implementation-risks.md) — **R-68a** corrected from BLOCKED (#177 now closed).
- [public/README.md](../README.md) — artifact index row 07 status `todo → draft`, linked to this package.
- **Issue updates (post-merge):** link this package from epic [#165](https://github.com/shaes-farm/time-traveler/issues/165); annotate [#65–#69](https://github.com/shaes-farm/time-traveler/issues/65) with their [§2b](#2b-new-validation-driven-prerequisites) prerequisites; close [#173](https://github.com/shaes-farm/time-traveler/issues/173) referencing the [GO verdict](#33-verdict).

---

## 5. Verification (readiness portion of #173 AC)

- [x] **Recommendations mapped to concrete issue updates** — §1 table (finding → doc/ticket).
- [x] **Required changes to #65–#69 prerequisites identified** — §2 (status correction R-68a + new prerequisites + carried gates).
- [x] **Go/no-go criteria for starting visualization implementation are explicit** — §3 checklist + verdict.
- [x] **Updated issue dependencies reflect findings** — §2a/§4 (R-68a unblocked; per-ticket annotations enumerated).

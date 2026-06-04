---
goal: Align publish workflow wireframes with shipped timeline behavior and events precondition (issue #212)
version: 1.0
date_created: 2026-06-04
last_updated: 2026-06-04
owner: Architecture + Documentation (docs/design/admin)
status: "Planned"
tags: [feature, documentation, architecture, publication-model, wireframes]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan resolves issue #212 by aligning the publish workflow documentation with implemented behavior from #43: timeline publication is no longer available in the timeline editor and is deferred to timeline detail. It also formalizes the publishability precondition (a timeline requires at least one linked event) and records whether event-editor publish convenience remains valid.

## 1. Requirements & Constraints

- **REQ-001**: Update `docs/design/admin/02-wireframes/16-publish-workflow.md` section "Surfaces and behavior" item 2 so timeline editor publish convenience is removed.
- **REQ-002**: Add explicit timeline publishability precondition to the model and behavior text: timeline requires >=1 linked event to publish.
- **REQ-003**: State that timeline publication action is detail-page-only and confirm dialog remains part of publish/unpublish transitions.
- **REQ-004**: Rework `Publish on an unsaved new entity` edge case in wireframe 16 so it no longer depends on timeline editor toggle behavior.
- **REQ-005**: Document decision for event editor publish toggle: keep or remove, with rationale tied to model differences between timelines and events.
- **REQ-006**: Keep docs consistent with #43 and #44 split (editor writes draft-only; detail owns publication transitions).
- **CON-001**: Scope is documentation/spec alignment only (no service, hook, or UI code changes in this issue).
- **CON-002**: Do not contradict ADR-0011 publication model and ADR-0014/0015 authorization posture.
- **GUD-001**: Preserve existing wireframe style and annotation density in `docs/design/admin/02-wireframes/`.
- **PAT-001**: Treat publishability gate as both UI rule and service guard in documentation language (defense in depth), even if implementation is tracked in separate issues.

## 2. Implementation Steps

### Implementation Phase 1 — Baseline and decision framing

- **GOAL-001**: Capture current divergence and make the event-toggle decision explicit before editing docs.

| Task     | Description                                                                                                                                                                                     | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Record source-of-truth divergence from issue #212 in the plan context and map each requested change to an exact target section in wireframe 16.                                                 |           |      |
| TASK-002 | Compare timeline vs event publication affordances across wireframes 12, 13, 09, and 16; decide whether event editor publish convenience remains justified because events can be self-contained. |           |      |
| TASK-003 | Document decision statement for event editor toggle as one of: Keep, Remove, or Conditional, including rationale and downstream doc touchpoints.                                                |           |      |

### Implementation Phase 2 — Wireframe 16 updates

- **GOAL-002**: Update publish-workflow canonical document to match shipped timeline behavior and add publishability precondition.

| Task     | Description                                                                                                                                                                                           | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-004 | Edit `docs/design/admin/02-wireframes/16-publish-workflow.md` "Surfaces and behavior" item 2: remove timeline editor publish-convenience language and state timeline publication is detail-page-only. |           |      |
| TASK-005 | Add a "timeline publishability precondition" statement to the model/behavior sections: publish requires at least one linked event (UI gate + service guard).                                          |           |      |
| TASK-006 | Update edge case `Publish on an unsaved new entity` so timelines and events are handled distinctly (timelines: not publishable from editor; events: behavior per decision in TASK-003).               |           |      |
| TASK-007 | Add an explicit note in wireframe 16 clarifying that timeline editor writes draft-only and does not change live state.                                                                                |           |      |

### Implementation Phase 3 — Cross-wireframe consistency edits

- **GOAL-003**: Remove contradiction points in related wireframes and preserve a single canonical interpretation.

| Task     | Description                                                                                                                                                                                          | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Edit `docs/design/admin/02-wireframes/12-timeline-editor.md` annotations/data-captured text to remove or reword any timeline editor publish-toggle language that conflicts with issue #212 decision. |           |      |
| TASK-009 | Verify `docs/design/admin/02-wireframes/13-timeline-detail.md` describes publish action as canonical and add/link precondition language if missing.                                                  |           |      |
| TASK-010 | Edit `docs/design/admin/02-wireframes/09-event-editor.md` only if needed to align with TASK-003 event-toggle decision and avoid accidental cross-entity conflation.                                  |           |      |
| TASK-011 | Update any inventory/index references (`docs/design/admin/00-screen-inventory.md` and in-file cross-links) that still imply timeline editor publish convenience.                                     |           |      |

### Implementation Phase 4 — Traceability and validation

- **GOAL-004**: Ensure every issue #212 acceptance point is traceable and verifiable.

| Task     | Description                                                                                                                                                                                        | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-012 | Add an explicit "issue alignment" note in wireframe 16 referencing #212 and relation to #43/#44/#127 so future contributors understand why timeline editor publish was removed.                    |           |      |
| TASK-013 | Run repository documentation quality checks (`pnpm run format`, `pnpm run lint`, `pnpm run check-types`, `pnpm run build`) to confirm no markdown or import-link regressions in docs-linked pages. |           |      |
| TASK-014 | Perform manual verification matrix: each changed section maps to REQ-001..REQ-006 and no remaining timeline-editor publish language exists in admin wireframes.                                    |           |      |

## 3. Alternatives

- **ALT-001**: Keep wireframe 16 unchanged and annotate #43 as an implementation exception. Rejected because the wireframe would continue to mislead future implementation work.
- **ALT-002**: Remove editor publish convenience for both timelines and events. Deferred pending explicit product/UX decision; events may remain self-contained and still benefit from convenience publish.
- **ALT-003**: Move publishability precondition to implementation issues only. Rejected because design docs are canonical behavior contracts for future UI and service work.

## 4. Dependencies

- **DEP-001**: Issue #212 (this plan's source requirement).
- **DEP-002**: Issue #43 (timeline editor behavior already changed to draft-only).
- **DEP-003**: Issue #44 (timeline detail publish action ownership).
- **DEP-004**: Issue #127 (wireframe/spec divergence tracker).
- **DEP-005**: `docs/design/admin/02-wireframes/16-publish-workflow.md` (canonical cross-cutting publish behavior).
- **DEP-006**: `docs/design/admin/02-wireframes/12-timeline-editor.md`, `docs/design/admin/02-wireframes/13-timeline-detail.md`, `docs/design/admin/02-wireframes/09-event-editor.md`.

## 5. Files

- **FILE-001**: `docs/plans/feature-publish-workflow-spec-alignment-1.md` — implementation plan file for issue #212.
- **FILE-002**: `docs/design/admin/02-wireframes/16-publish-workflow.md` — primary doc update target.
- **FILE-003**: `docs/design/admin/02-wireframes/12-timeline-editor.md` — remove/adjust conflicting timeline editor publish language.
- **FILE-004**: `docs/design/admin/02-wireframes/13-timeline-detail.md` — verify/augment canonical publish behavior + precondition.
- **FILE-005**: `docs/design/admin/02-wireframes/09-event-editor.md` — update only if event-toggle decision requires.
- **FILE-006**: `docs/design/admin/00-screen-inventory.md` — consistency pass if publication ownership references need correction.

## 6. Testing

- **TEST-001**: Text search confirms no remaining timeline-editor publish-convenience statements outside explicitly historical notes.
- **TEST-002**: Wireframe 16 contains explicit timeline precondition (>=1 linked event) and identifies UI gate + service guard.
- **TEST-003**: Timeline editor wireframe text states draft-only behavior and detail-page publication ownership.
- **TEST-004**: Event editor publish toggle treatment is explicit and justified (kept/removed/conditional) with no ambiguity.
- **TEST-005**: All markdown links resolve and workspace checks pass (`pnpm run format`, `pnpm run lint`, `pnpm run check-types`, `pnpm run build`).

## 7. Risks & Assumptions

- **RISK-001**: Event editor publish-toggle decision may require stakeholder confirmation if product intent is not explicit in current issues.
- **RISK-002**: If publishability precondition wording is too implementation-specific, docs may drift again when service behavior evolves.
- **RISK-003**: Partial doc updates can create contradictory behavior contracts across wireframes.
- **ASSUMPTION-001**: #43 behavior change is accepted baseline and should be reflected as canonical in docs.
- **ASSUMPTION-002**: Timeline publishability precondition (>=1 linked event) is the intended product rule and remains in force.
- **ASSUMPTION-003**: This issue does not require an ADR because it aligns docs with existing decisions rather than introducing a new cross-cutting architecture choice.

## 8. Related Specifications / Further Reading

- [docs/design/admin/02-wireframes/16-publish-workflow.md](../design/admin/02-wireframes/16-publish-workflow.md)
- [docs/design/admin/02-wireframes/12-timeline-editor.md](../design/admin/02-wireframes/12-timeline-editor.md)
- [docs/design/admin/02-wireframes/13-timeline-detail.md](../design/admin/02-wireframes/13-timeline-detail.md)
- [docs/design/admin/02-wireframes/09-event-editor.md](../design/admin/02-wireframes/09-event-editor.md)
- [docs/system-design.md](../system-design.md)
- [docs/adr/adr-0011-publication-model.md](../adr/adr-0011-publication-model.md)
- [docs/adr/adr-0014-rls-single-source-of-authorization.md](../adr/adr-0014-rls-single-source-of-authorization.md)
- [docs/adr/adr-0015-rls-and-function-hardening.md](../adr/adr-0015-rls-and-function-hardening.md)
- Related issues: #212, #43, #44, #127

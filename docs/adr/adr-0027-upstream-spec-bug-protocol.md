---
title: "ADR-0027: Upstream Spec/Schema Bug Protocol and PRD Reconciliation"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "process", "governance"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0027: Upstream Spec/Schema Bug Protocol and PRD Reconciliation

## Status

**Accepted (retroactively documented 2026-05-30)** — codified in
`.github/copilot-instructions.md` and `CLAUDE.md` ("When you find a spec or
upstream bug"); exemplified by #73 (workaround template), #127 (wireframe↔PRD
divergence), and the PRD §7.2.2 in-place reconciliation (ADR-0024).

## Context

Implementation routinely reveals that an upstream artifact — `docs/system-design.md`,
the PRD, the schema, or a wireframe — is wrong or has drifted from what the code
actually does. Silently coding around such bugs hides them, lets the spec rot, and
recreates the exact knowledge gap this ADR series exists to close. A consistent
protocol is needed for both code-level upstream bugs and documentation divergences.

## Decision

Adopt a two-track **upstream-discrepancy protocol**:

- **Upstream _bug_ → file a tracking issue, don't work around it silently.** When
  implementation reveals a bug in the spec/schema/wireframe, file a separate GitHub
  issue documenting the bug, its evidence, the workaround applied in code, and the
  recommended upstream fix; reference the tracking issue in the workaround comment
  when the workaround is non-obvious (template: #73).
- **Documentation _divergence_ → reconcile in place and record it.** When a doc
  (e.g., the PRD) merely needs to catch up to a sound implementation decision,
  update the doc in place and record the divergence in the relevant design doc —
  optionally without a separate issue (as done for PRD §7.2.2 in
  `03-aesthetic-notes.md`, ADR-0024; and tracked for wireframe↔PRD §7.11 in #127).
- **Block, don't guess.** Missing API/service → `// BLOCKED:`; missing credential →
  `// NEEDS:`; ambiguous business logic → `// DECISION NEEDED:` + the conservative
  path; conflict with an existing convention → follow the convention and flag it.
- **Going forward, architectural decisions are captured as ADRs** in `docs/adr/`
  (this series); new decisions continue from **ADR-0028+**.

## Consequences

### Positive

- **POS-001**: Upstream bugs become visible/trackable instead of buried in silent
  workarounds, keeping the spec trustworthy.
- **POS-002**: The block-don't-guess rules keep contributors (human and agent) from
  inventing values or business logic.
- **POS-003**: Pairing this with the ADR process closes the documentation gap this
  backfill addressed and prevents its recurrence.

### Negative

- **NEG-001**: Filing issues and writing ADRs is overhead on top of shipping code;
  the discipline must be sustained to pay off.
- **NEG-002**: The bug-vs-divergence distinction requires judgment; borderline
  cases could be handled inconsistently without review attention.

## Alternatives Considered

### Fix upstream artifacts silently in the same PR

- **ALT-001**: **Description**: Patch the spec/schema inline without an issue or
  record.
- **ALT-002**: **Rejection Reason**: Hides the discrepancy and its rationale;
  reviewers and future contributors lose the trail — the exact failure mode this
  ADR prevents.

### No formal decision record going forward

- **ALT-003**: **Description**: Rely on PRs/commit messages for architectural
  rationale.
- **ALT-004**: **Rejection Reason**: That is precisely the gap that required this
  retroactive backfill; ADRs make decisions first-class and findable.

## Implementation Notes

- **IMP-001**: Protocol text lives in `.github/copilot-instructions.md` and
  `CLAUDE.md`; a "When to write an ADR" rule is added there pointing at
  `docs/adr/`.
- **IMP-002**: Reference examples: #73 (bug+workaround template), #127 (tracked
  divergence), PRD §7.2.2 in-place reconciliation (ADR-0024).
- **IMP-003**: New ADRs start at 0028; `docs/adr/README.md` documents the
  "when/how to add one" process.

## References

- **REF-001**: ADR-0024 (PRD §7.2.2 reconciliation example), ADR-0000 (template),
  `docs/adr/README.md` (process)
- **REF-002**: `.github/copilot-instructions.md`; `CLAUDE.md`; issues #73, #127
- **REF-003**: Conventional ADR / decision-log practice

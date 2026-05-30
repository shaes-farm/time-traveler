---
title: "ADR-0018: Curated Content Library via Admin-Owned Content + Deep-Copy Import Edge Function"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-22"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "content", "edge-functions"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0018: Curated Content Library via Admin-Owned Content + Deep-Copy Import Edge Function

## Status

**Accepted (retroactively documented 2026-05-30)** — specified in
`docs/system-design.md` §12 (Appendix B Decision #17); enabled by the existing
schema (`00001`/`00002`), RLS (`00007`), and storage (`00009`).

## Context

The product needs a starter/curated library of timelines, periods, events, and
characters that users can browse and bring into their own workspace as an editable
starting point. This requires deciding how "library" content is stored, how it is
distinguished from user content, and what "import" means (reference vs. copy).

## Decision

Model the curated library as **ordinary admin-owned content** (the same tables as
user content), flagged with **`metadata.is_library_content = true`** rather than a
separate schema. Library rows are published (ADR-0011), so they are globally
readable via the existing RLS read pattern (ADR-0014) — no special-case policy.

**Importing is a deep copy**, performed by a **`library-import` Edge Function**:
it clones the selected library entity graph (entity + its junctions + media
references) into new rows **owned by the importing user**, so the user's copy is
fully editable and independent of the original. Import is an Edge Function (not
PostgREST/CRUD) because it is a multi-step, atomic, cross-entity operation
(ADR-0012's non-atomic-junction caveat is exactly what a deep copy must avoid).

## Consequences

### Positive

- **POS-001**: Zero new tables/policies — library content reuses the content
  schema, RLS, and storage already in place; the only marker is a metadata flag.
- **POS-002**: Deep copy gives users a clean, owned, editable starting point with
  no shared-mutation coupling to the source library entity.
- **POS-003**: Putting import in an Edge Function gives it atomicity and a single
  trusted place for the clone logic, avoiding the non-atomic junction problem of
  client-side multi-step writes (ADR-0012).

### Negative

- **NEG-001**: Deep copy duplicates data — library updates do **not** propagate to
  already-imported copies (accepted: imports are meant to be independent forks).
- **NEG-002**: `metadata.is_library_content` is a JSONB convention, not a typed
  column, so library-vs-user filtering depends on querying JSONB consistently.
- **NEG-003**: The Edge Function must faithfully walk the entity graph; missing a
  junction type in the clone would yield an incomplete import.

## Alternatives Considered

### Reference (shallow link) instead of deep copy

- **ALT-001**: **Description**: Point the user's workspace at shared library rows.
- **ALT-002**: **Rejection Reason**: Users couldn't edit without mutating the
  shared original (or needing copy-on-write); a deep copy is simpler and matches
  "starting point you own."

### A separate library schema / dedicated tables

- **ALT-003**: **Description**: Parallel `library_*` tables distinct from user
  content.
- **ALT-004**: **Rejection Reason**: Doubles the schema and forces import to map
  between two shapes; admin-owned + flag reuses everything.

## Implementation Notes

- **IMP-001**: Library entities are admin-owned, `published = true`, with
  `metadata.is_library_content = true` (`docs/system-design.md` §12).
- **IMP-002**: `library-import` Edge Function clones the entity graph into
  user-owned rows; sits alongside `publish` and export functions (ADR-0011,
  ADR-0016).
- **IMP-003**: Discoverability/seeding of library content is covered by
  `docs/seeding-discovery.md` and `scripts/seed-discovery.mts`.

## References

- **REF-001**: ADR-0011 (published library content), ADR-0012 (why import is an
  Edge Function, not CRUD), ADR-0014 (global-read RLS), ADR-0017 (admin ownership)
- **REF-002**: `docs/system-design.md` §12; `docs/seeding-discovery.md`
- **REF-003**: PRD §12 (content library / starter content)

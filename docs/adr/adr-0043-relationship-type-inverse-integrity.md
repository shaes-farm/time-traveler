---
title: "ADR-0043: Type inverses are paired by RPC, and a type may not be its own inverse"
status: "Accepted"
date: "2026-08-24"
authors: "Engineering"
tags: ["architecture", "decision", "database", "schema", "postgres", "supabase"]
supersedes: ""
superseded_by: ""
amends: "adr-0040-relationship-vocabulary-reference-data.md"
amended_by: ""
---

# ADR-0043: Type inverses are paired by RPC, and a type may not be its own inverse

## Status

**Accepted** — extends the ADR-0042 treatment from `relationship_roles` up to
`relationship_types`, in `00032_relationship_type_inverse_integrity.sql`.

## Context

[ADR-0042](adr-0042-relationship-role-inverse-integrity.md) closed two gaps
around `relationship_roles.inverse_key`: dangling references, and one-sided
pairings. It closed them for roles only. `relationship_types.inverse_key` — the
column one level up, which says "the reciprocal `character_relationships` row
carries _that_ type" — was left exactly as `00029_relationship_vocabulary.sql`
wrote it (lines 82-84): a self-FK, and nothing else.

That was survivable because nothing had ever written one.
`00030_seed_relationship_vocabulary.sql` leaves `inverse_key` NULL on all 32
seeded types (line 37), and its own pgTAP asserts that as a fact (line 148). The
admin CRUD surface from #428 makes the column writable from a form, which is
what changes the calculus — and the consequences at this level are worse than at
the role level.

**1. One-sided pairings orphan relationship rows.** Setting
`superseded.inverse_key = 'friendship'` through PostgREST does not set
`friendship.inverse_key = 'superseded'`. The reciprocal writer takes involution
as given: `reciprocalTypeFor` (`character-relationship-service.ts` lines
135-142) resolves an A→B row's reciprocal type through `inverse_key`, and
`deleteReciprocalRow` (lines 555-592) later goes looking for exactly the row it
believes was written. Against a one-sided inverse that row never existed, the
delete matches nothing, and the original assertion is orphaned — a silent
correctness failure in the reader, far from the vocabulary edit that caused it.

**2. The symmetry CHECK could fire on an untouched row.**
`relationship_types_symmetric_has_no_inverse` (00029 lines 96-97) forbids a
symmetric type from carrying an inverse. Naming a symmetric type as _your_
inverse is legal on your own row and only becomes illegal once the pairing is
written back to it. Without a pairing step there is no back-write and the
vocabulary just goes quietly inconsistent; with one, the admin would get a raw
`23514` naming a row they never edited.

**3. The service was still merging outside the lock.** `updateRelationshipType`
had the read-then-write shape ADR-0042 NEG-003 records as a defect: it `SELECT`ed
`is_symmetric, inverse_key` in a separate, unlocked round trip so it could judge
the symmetry invariant against the merged row, then wrote. Two admins patching
different columns of the same type each merged the same pre-edit snapshot, and
the later write silently reverted the earlier one. The same bug, one level up,
introduced for the same reason: the invariant needs the merged row and the merge
had nowhere else to happen.

A fourth question surfaced while implementing, and it resolves the opposite way
from ADR-0042: whether a **type** may be its own inverse. It may not.

## Decision

**Three layers, in `00032_relationship_type_inverse_integrity.sql`.** The self-FK
already exists from 00029, so this migration is the other two plus a constraint.

**1. `CHECK (inverse_key IS DISTINCT FROM key)`.** ADR-0042 ALT-005 rejected the
role-level version of this constraint because self-inversion _is_ the symmetric
encoding for a role. At the type level the analogy inverts: a type has
`is_symmetric`, and 00029 lines 76-80 spell the encoding out as three-way
(`is_symmetric` → same type; `inverse_key` set → that type; neither → no
reciprocal). A self-inverse type is a second, mute spelling of the first state —
one the admin form's `symmetryModeOf` cannot represent, and one that would make
the reciprocal writer resolve through a different branch to the same answer. No
seeded row sets `inverse_key` at all, so it applies cleanly.

**2. `pair_relationship_type_inverse(p_key, p_inverse_key)`.** The same
three-statement, set-based shape as `pair_relationship_role_inverse` (00031 lines
99-139): release any other type still naming the target, release any other type
claiming the new partner, then point the new partner back. Set-based rather than
read-then-write on captured values, so it also repairs a corpus that was already
one-sided, and it is idempotent.

One step the role helper does not need: before writing back, the helper refuses
a **symmetric partner** with `ERRCODE = '22023'` and a sentence naming the type.
Writing to it would breach `relationship_types_symmetric_has_no_inverse` on a
row the admin never edited, and the service turns the SQLSTATE into prose the
way it does for every other constraint on this table.

**3. `set_relationship_type` and `create_relationship_type`**, matching their
role counterparts: `SECURITY INVOKER` so RLS remains the single source of
authorization (ADR-0014), `search_path = ''`, `EXECUTE` revoked from
`PUBLIC`/`anon` and granted to `authenticated, service_role` (ADR-0034), and
kept as two functions rather than one upsert so `23505` stays a name clash
(ADR-0042 ALT-009).

**Update is a partial patch merged under the lock**, which is what retires the
service-side pre-read described in Context §3:

```sql
set_relationship_type(
  p_key             VARCHAR(100),
  p_label           TEXT         DEFAULT NULL,
  p_category_key    VARCHAR(50)  DEFAULT NULL,
  p_sort_order      INTEGER      DEFAULT NULL,
  p_is_active       BOOLEAN      DEFAULT NULL,
  p_description     TEXT         DEFAULT NULL,
  p_set_description BOOLEAN      DEFAULT false,
  p_is_symmetric    BOOLEAN      DEFAULT NULL,
  p_inverse_key     VARCHAR(100) DEFAULT NULL,
  p_direction_verb  TEXT         DEFAULT NULL,
  p_symmetric_noun  TEXT         DEFAULT NULL,
  p_set_symmetry    BOOLEAN      DEFAULT false
)
```

`label`, `category_key`, `sort_order` and `is_active` use `NULL` as the
"unchanged" sentinel — all four are `NOT NULL`, so `COALESCE` is unambiguous.
`description` is nullable and gets its own `p_set_description` flag, exactly as
`inverse_key` did for roles.

**The four symmetry columns are governed by a single flag and written as one
unit.** Not four flags. `is_symmetric`, `inverse_key`, `direction_verb` and
`symmetric_noun` are mutually constrained — a symmetric type must carry no
inverse and reads with its noun, a directed one reads with its verb — so a patch
moving one without the others can only produce a row the CHECK rejects or the UI
cannot render. The admin form already derives all four from one radio group
(`symmetryColumns` / `symmetryFields` in `vocabulary-form-mappers.ts`); this
makes that grouping binding rather than conventional, and it is what lets the
CHECK see a coherent merged row inside the lock.

**The lock is table-wide.** Type pairing is not scoped the way role pairing is —
any type may name any other — so `set_relationship_type` and
`create_relationship_type` lock every `relationship_types` row `ORDER BY key FOR
UPDATE`. Deterministic order, so concurrent callers serialize rather than
deadlock. The vocabulary is 32 rows and these are admin-only operations.

## Consequences

### Positive

- **POS-001**: Involution now holds for type inverses across writes, not merely
  across a seed file that declares none.
  `00032_relationship_type_inverse_integrity_test.sql` asserts it after each RPC
  write and once corpus-wide.
- **POS-002**: The orphaned-reciprocal failure in Context §1 is unreachable
  through the admin surface. `reciprocalTypeFor` and `deleteReciprocalRow` can go
  on assuming involution, because the write path now maintains it.
- **POS-003**: The lost update in `updateRelationshipType` is gone, and so is the
  pre-read that caused it. `assertSymmetryInvariant` — the client-side merged-row
  guard that existed only to compensate for the missing lock — is deleted, which
  removes one more place the vocabulary's rules were restated outside the
  database (the failure mode ADR-0040 was written about).
- **POS-004**: "Stealing" a partner is defined rather than accidental, and the
  admin sees whose partner they are about to take before choosing: the inverse
  picker labels an already-paired candidate with its current partner.
- **POS-005**: A symmetric type can no longer be offered — or accepted — as an
  inverse. The picker filters them out and the helper refuses them, so the
  `23514`-on-a-row-you-never-edited path has two guards rather than none.

### Negative

- **NEG-001**: As with ADR-0042 NEG-001, involution is guaranteed _through the
  RPC_, not for every write path. A direct PostgREST `PATCH` on
  `relationship_types` can still leave a one-sided pairing. Mitigated by routing
  the service's type writes through the RPC. ADR-0042 ALT-003 (a deferred
  constraint trigger) would close it for both tables at once and remains the
  escalation if it ever bites.
- **NEG-002**: The symmetry quad is all-or-nothing. A caller that wants to change
  only `direction_verb` must resend all four columns. The admin form already
  emits them as a group, so this costs nothing today, but it is a sharper edge
  than the per-column sentinels the other fields get. `updateRelationshipType`
  rejects a partial quad with a developer-facing error rather than silently
  clearing the columns the caller left out.
- **NEG-003**: The table-wide `FOR UPDATE` lock is coarser than ADR-0042
  NEG-005's type-wide one — every type row, not every role of one type. Two
  admins editing unrelated types now serialize. Acceptable at 32 rows and
  admin-only frequency; unavoidable while pairing can cross any two rows.
- **NEG-004**: A fourth write path exists for `relationship_types` (PostgREST
  insert, PostgREST update, two RPCs). Same contributor hazard as ADR-0042
  NEG-002: reaching for `.from("relationship_types").update()` gets the old
  behaviour with no warning.
- **NEG-005**: `pair_relationship_type_inverse` is in `public`, so PostgREST
  exposes it to `authenticated`. Harmless — RLS gates every statement in it and
  it only writes `inverse_key` — but it is API surface that exists for internal
  reasons. Same as ADR-0042 NEG-004.
- **NEG-006**: The helper checks the _partner's_ symmetry, not the target's. A
  target that is itself symmetric while naming an inverse is caught by the CHECK
  on its own row instead, which is the row the admin is editing — so the error
  points at the right place, but the two illegal combinations are rejected by
  two different mechanisms with two different messages.

## Alternatives Considered

### Guard the picker in the UI and write the partner from the service

- **ALT-001**: **Description**: No migration. Filter symmetric and
  already-paired types out of the inverse picker, and have
  `updateRelationshipType` issue a second write to the partner row after the
  primary one.
- **ALT-002**: **Rejection Reason**: Two writes with no transaction around them
  is the half-paired failure 00026 and ADR-0042 POS-003 both exist to remove — if
  the second call fails the vocabulary is left exactly as broken as doing
  nothing. It also leaves the lost update in Context §3 untouched, since the
  merged-row read would still happen outside any lock, and it leaves PostgREST
  wide open. The UI filter is worth having and is part of this decision; it is
  not a substitute for the DB layer.

### `CHECK (inverse_key IS DISTINCT FROM key)` — rejected for roles, adopted here

- **ALT-003**: **Description**: Allow a type to be its own inverse, as roles are
  allowed to be (ADR-0042 ALT-005/006), rather than adding the CHECK.
- **ALT-004**: **Rejection Reason**: The reasoning that saved self-inversion for
  roles is what condemns it for types. A role has no symmetry flag, so
  self-inversion is the _only_ way to say "symmetric"; a type has
  `is_symmetric`, so self-inversion is a duplicate spelling of a state that
  already has a canonical one. Two encodings of one state is how the vocabulary
  drifted before ADR-0040. Nothing in the seeded corpus relies on it, so unlike
  the role case the constraint applies cleanly.

### Four independent set-flags for the symmetry columns

- **ALT-005**: **Description**: `p_set_is_symmetric`, `p_set_inverse_key`,
  `p_set_direction_verb`, `p_set_symmetric_noun`, each gating its own column, for
  symmetry with how `p_set_inverse_key` works in `set_relationship_role`.
- **ALT-006**: **Rejection Reason**: The four columns are not independent. A
  patch that sets `is_symmetric = true` without clearing `inverse_key` is exactly
  the CHECK violation, and one that switches a type to directed without supplying
  a `direction_verb` produces a row the reader renders with no verb. Independent
  flags would make every one of those states expressible and push the burden of
  keeping them consistent back onto callers — which is where it was before this
  ADR. One flag makes the coupling structural. NEG-002 is the price.

### Reuse `set_relationship_role`'s per-column sentinel design wholesale

- **ALT-007**: **Description**: Model this function as closely as possible on the
  role one, treating the two tables' update semantics as a single pattern.
- **ALT-008**: **Rejection Reason**: They are the same pattern where the columns
  behave the same way and diverge where the columns do. `relationship_types` has
  a multi-column invariant that `relationship_roles` does not, and a nullable
  `description` that `relationship_roles` does not have. Forcing symmetry between
  the two signatures would mean either dropping the CHECK's protection or
  restating it in the service, and restating database rules in the service is the
  specific thing ADR-0040 was written to stop.

## Implementation Notes

- **IMP-001**: `supabase/migrations/00032_relationship_type_inverse_integrity.sql`.
  Purely additive: one CHECK, one partial index, three functions, three grant
  pairs. Rollback is `DROP FUNCTION` ×3, `DROP CONSTRAINT`, `DROP INDEX` — no
  data is rewritten, so it restores the 00029 state exactly.
- **IMP-002**: `relationship_types_inverse_key_idx` is partial
  (`WHERE inverse_key IS NOT NULL`) and serves the self-FK's `ON DELETE SET NULL`
  probe, which searches by `inverse_key` while the PK is on `key`. Same reasoning
  as 00029 line 146 and ADR-0042 IMP-002.
- **IMP-003**: `supabase/tests/database/00032_relationship_type_inverse_integrity_test.sql`
  (46 assertions) covers the CHECK, function signatures and security mode, anon's
  lack of `EXECUTE`, pairing after a write, partner stealing, clearing from both
  sides, the symmetric-partner refusal, `ON DELETE SET NULL`, duplicate create,
  not-found update, both non-admin refusals, and a corpus-wide involution sweep.
  A partial-patch section asserts that each single-column patch leaves every
  other column byte-identical and that a patch stating no column writes nothing —
  the same stand-in for untestable concurrency that ADR-0042 IMP-004 describes.
- **IMP-004**: `createRelationshipType` and `updateRelationshipType` in
  `packages/services/src/modules/relationship-type-service.ts` now call the RPCs.
  The update path validates the all-or-nothing quad before the call and throws a
  developer-facing error naming the missing fields (NEG-002).
- **IMP-005**: `assertSymmetryInvariant` is removed from
  `packages/services/src/schemas/relationship-vocabulary.ts`. It existed only for
  the pre-read this ADR retires, and the message it produced is already the one
  `TYPE_WRITE_ERRORS` maps from the constraint name.
- **IMP-006**: The inverse picker in `type-inspector.tsx` offers only directed
  types other than the one being edited, and appends "— currently paired with X"
  to any candidate that already has a partner. The DB refuses a symmetric
  partner regardless; the filter keeps the UI from offering a choice guaranteed
  to be rejected.
- **IMP-007**: As ADR-0042 IMP-006 notes, the Supabase generator models a
  defaulted argument as optional but never as nullable, so the nullable RPC
  arguments (`p_inverse_key`, `p_direction_verb`, `p_symmetric_noun`,
  `p_description`) need a cast at the service boundary.

## References

- **REF-001**: [ADR-0042](adr-0042-relationship-role-inverse-integrity.md) — the
  role-level decision this extends, and the source of the pairing-helper shape,
  the `SECURITY INVOKER` posture, and the merge-under-the-lock rule.
- **REF-002**: [ADR-0040](adr-0040-relationship-vocabulary-reference-data.md) —
  the reference-data refactor; this closes its NEG-006 ("`inverse_key` documents
  intent but no DB guard forces correct authoring").
- **REF-003**: [ADR-0041](adr-0041-admin-only-surfaces-and-immutable-vocabulary-keys.md)
  — the admin surface these writes come from, and why key renames stay in SQL.
- **REF-004**: [ADR-0014](adr-0014-rls-single-source-of-authorization.md) and
  [ADR-0034](adr-0034-api-role-table-grants.md) — why the RPCs are
  `SECURITY INVOKER` and how they are granted.
- **REF-005**: `supabase/migrations/00029_relationship_vocabulary.sql` lines
  68-98 (the types table, its self-FK and its symmetry CHECK), and
  `00030_seed_relationship_vocabulary.sql` line 37 (no seeded type declares an
  inverse).
- **REF-006**: `packages/services/src/modules/character-relationship-service.ts`
  lines 135-142 and 555-592 — the reciprocal writer whose correctness depends on
  type involution.
- **REF-007**: PR #439 review round three, issue #428.

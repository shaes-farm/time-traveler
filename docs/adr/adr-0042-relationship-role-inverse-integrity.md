---
title: "ADR-0042: Role inverses are a composite self-FK plus an explicit pairing RPC"
status: "Accepted"
date: "2026-08-18"
authors: "Engineering"
tags: ["architecture", "decision", "database", "schema", "postgres", "supabase"]
supersedes: ""
superseded_by: ""
amends: "adr-0040-relationship-vocabulary-reference-data.md"
amended_by: ""
---

# ADR-0042: Role inverses are a composite self-FK plus an explicit pairing RPC

## Status

**Accepted**

## Context

[ADR-0040](adr-0040-relationship-vocabulary-reference-data.md) turned the
relationship vocabulary into reference data. `relationship_roles` (the ADR-0009
sub-role taxonomy) carries `inverse_key` — the role the reciprocal
`character_relationships` row should take: `parent` inverts to `child`, `spouse`
inverts to itself. That column drove the `ROLE_INVERSE` map the service used to
hard-code.

`relationship_types.inverse_key` got a self-FK in
`00029_relationship_vocabulary.sql` (lines 82-84). `relationship_roles.inverse_key`
did not — it shipped as a bare `VARCHAR(100)` (line 110). The Zod schema recorded
this as intentional: "deliberately not an FK … validated by pgTAP and the app
rather than by the database". Two gaps followed, and the admin CRUD surface from
#428 (PR #439) made both reachable from a form rather than from a considered SQL
session.

**1. Dangling references.** Deleting the `child` role left
`parent.inverse_key = 'child'` pointing at nothing. The vocabulary then looks
valid but produces a reciprocal row whose `(type, role)` pair fails the composite
FK on `character_relationships` (00029 lines 137-141) — the failure surfaces on
the _relationship_ write, far from the vocabulary edit that caused it.

**2. One-sided pairings.** Nothing made a pairing mutual. Setting
`a.inverse_key = 'b'` through PostgREST did not set `b.inverse_key = 'a'`.
Involution — `inverse(inverse(x)) = x` — was only ever asserted against the
seeded corpus, by `00030_seed_relationship_vocabulary_test.sql` lines 134-140.
That test catches drift in the seed file; it cannot stop a write. A one-sided
pairing means editing a relationship silently drifts its reciprocal's role, which
is precisely the failure ADR-0009 introduced the taxonomy to prevent.

A third, related question surfaced while implementing: whether a role should be
allowed to be its own inverse. It should — and must. Sixteen of the thirty-two
roles seeded by `00030` are self-inverse (`spouse ↔ spouse`, `sibling ↔ sibling`,
`cousin ↔ cousin`, every `collaboration` role). Self-inversion is the role-level
analogue of `relationship_types.is_symmetric` and satisfies involution trivially.

## Decision

**Three layers, in `00031_relationship_role_inverse_integrity.sql`.**

**1. A composite self-FK.**

```sql
FOREIGN KEY (type_key, inverse_key)
  REFERENCES public.relationship_roles (type_key, key)
  ON UPDATE CASCADE
  ON DELETE SET NULL (inverse_key)
```

Composite, not scalar: the PK is `(type_key, key)`, so `key` alone has no unique
index to reference, and pairing is always _within_ a type — the composite FK
states that scoping rather than leaving it to convention. `ON UPDATE CASCADE`
matches the types precedent, so a role rename follows into its partner.
`ON DELETE SET NULL (inverse_key)` uses the PostgreSQL 15+ column list; a bare
`SET NULL` would try to null `type_key`, which is `NOT NULL`, and every role
delete would fail.

**2. No self-reference CHECK.** Self-inversion stays legal — it is the sanctioned
encoding for a symmetric role (see Context, and ALT-005 below).

**3. Two explicit RPCs — `set_relationship_role` and `create_relationship_role`
— that keep both sides of a pairing in step in one transaction**, sharing the
helper `pair_relationship_role_inverse(p_type_key, p_key, p_inverse_key)`. After
the target's own `inverse_key` is written, the helper:

- releases any _other_ role still naming the target (the partner it moved away
  from, or a stale claimant), exempting the new partner;
- releases any other role claiming the _new_ partner, so a pairing is stolen
  cleanly instead of leaving two roles naming one partner that names only one of
  them;
- points the new partner back at the target.

The helper is written as set-based predicates rather than read-then-write on
captured old values, so it also repairs a corpus that was already one-sided and
is idempotent. Each function first locks the type's roles `ORDER BY key FOR
UPDATE`: a deterministic order, so two admins re-pairing overlapping roles
serialize rather than deadlock.

**`SECURITY INVOKER`, like `delete_category_reparenting_children` (00026).** RLS
stays the single source of authorization (ADR-0014): the `is_admin()` policies
from 00029 §RLS apply to every statement inside the function. A non-admin's
`UPDATE` matches nothing and the function raises `no_data_found`; a non-admin's
`INSERT` is refused with `42501`. Neither function grants anything the caller did
not already have. `EXECUTE` is revoked from `PUBLIC`/`anon` and granted to
`authenticated, service_role`, per ADR-0034 and the 00026 grant pattern.

**Update is full replacement.** `set_relationship_role` takes every mutable
column and writes all of them. `inverse_key` has no "leave it alone" encoding
distinguishable from "clear it" — `NULL` is a meaningful value and plpgsql cannot
see which arguments the caller omitted — so a partial patch could silently break
a pairing. `type_key` and `key` address the row and are not editable; renaming a
key remains a SQL operation per ADR-0041.

## Consequences

### Positive

- **POS-001**: A role inverse can no longer name a role that does not exist, and
  deleting a role releases whoever named it, without any application code.
- **POS-002**: Involution is now a property of _writes_ through the RPC, not just
  of the seed file. `00031_relationship_role_inverse_integrity_test.sql` asserts
  it after each write and once corpus-wide.
- **POS-003**: Re-pointing an inverse is atomic. The previous two-call shape
  (update A, then update B) could leave the vocabulary half-paired if the second
  call failed — the same defect 00026 fixed for category deletion.
- **POS-004**: "Stealing" a partner is defined rather than accidental. Whatever
  order an admin edits roles in, at most one role claims a given partner.
- **POS-005**: The FK is `ON UPDATE CASCADE`, so the SQL-only rename path
  ADR-0041 preserved keeps working — verified against a type-key rename, which
  cascades `type_key` into all sixteen `family` roles without colliding with the
  self-FK's own cascade.

### Negative

- **NEG-001**: Involution is guaranteed _through the RPC_, not for every write
  path. A direct PostgREST `PATCH` on `relationship_roles` can still leave a
  one-sided pairing; the FK only stops dangling references. Mitigated by routing
  the service's role writes through the RPC, not by the database. A deferred
  constraint trigger would close this (ALT-003) at a cost judged too high.
- **NEG-002**: A third write path now exists for one table (PostgREST insert,
  PostgREST update, RPC). The service layer has to pick correctly; a contributor
  reaching for `.from("relationship_roles").update()` gets the old behaviour with
  no warning.
- **NEG-003**: Full-replacement update semantics mean the caller must send the
  whole mutable row. A caller holding only a partial patch has to merge it
  against the row it already has.
- **NEG-004**: `pair_relationship_role_inverse` is in `public`, so PostgREST
  exposes it to `authenticated`. It is harmless (RLS gates every statement in it,
  and it only ever writes `inverse_key`), but it is API surface that exists for
  internal reasons.
- **NEG-005**: The type-wide `FOR UPDATE` lock is coarser than locking the two or
  three rows involved. Acceptable: a type holds at most sixteen roles today and
  the operation is admin-only and rare.

## Alternatives Considered

### A trigger on `relationship_roles` that mirrors `inverse_key`

- **ALT-001**: **Description**: An `AFTER INSERT OR UPDATE` trigger that writes
  the partner's back-reference, so a plain PostgREST `PATCH` stays sufficient and
  every write path is covered — closing NEG-001.
- **ALT-002**: **Rejection Reason**: A trigger makes one row's edit silently
  rewrite two other rows, with recursion to suppress and no trace at the call
  site. This schema has consistently preferred the explicit function: 00026 chose
  `delete_category_reparenting_children` over a delete trigger for the same
  multi-row effect, and 00029's own comment on the composite FK
  ("…which is exactly the … semantics the dropped CHECK provided — **with no
  trigger**") records the same preference. An RPC also lets the service map
  failures to sentences, which a trigger firing under an opaque `PATCH` does not.

### A `DEFERRABLE INITIALLY DEFERRED` constraint trigger asserting involution

- **ALT-003**: **Description**: Check at commit that every non-NULL
  `inverse_key` is reciprocated, rejecting any transaction that leaves the table
  one-sided regardless of write path.
- **ALT-004**: **Rejection Reason**: It makes the RPC mandatory in practice —
  creating `child` with `inverse_key = 'parent'` would fail at commit until
  `parent` is updated in the same transaction — which breaks every existing plain
  write and the seed's incremental shape. The correctness win is real; revisit if
  NEG-001 ever bites.

### `CHECK (inverse_key IS DISTINCT FROM key)`

- **ALT-005**: **Description**: Forbid a role from being its own inverse, as the
  role-level analogue of `relationship_types_symmetric_has_no_inverse` (00029
  lines 96-97).
- **ALT-006**: **Rejection Reason**: The analogy does not hold. A _type_ has a
  separate `is_symmetric` flag, so naming itself as its inverse is redundant and
  ambiguous. A _role_ has no such flag — self-inversion **is** how a symmetric
  role is expressed, documented at 00029 line 108 and used by sixteen of the
  thirty-two rows seeded by 00030. The constraint would have failed to apply
  against the shipped vocabulary.

### A scalar FK on `inverse_key` alone

- **ALT-007**: **Description**: `inverse_key REFERENCES relationship_roles(key)`,
  mirroring the types table literally.
- **ALT-008**: **Rejection Reason**: Impossible as written — `key` is not unique
  on its own (`family.other` and `professional.other` both exist), and Postgres
  requires a unique key on the referenced columns. Adding one would also permit
  `family.parent` to name a `professional` role as its inverse, which the
  composite FK forbids by construction.

### An upsert (`set_relationship_role` handling both create and update)

- **ALT-009**: **Description**: One RPC with `INSERT … ON CONFLICT DO UPDATE`,
  covering creation-with-inverse without a second function.
- **ALT-010**: **Rejection Reason**: It turns "create a role whose key is already
  taken" from a `23505` the admin UI reports as a name clash into a silent
  overwrite of the existing role — a data-loss path on the most common create
  mistake. Two functions keep the insert's own error semantics intact.

## Implementation Notes

- **IMP-001**: `supabase/migrations/00031_relationship_role_inverse_integrity.sql`.
  Purely additive: one constraint, one partial index, three functions, three
  grant pairs. Rollback is `DROP FUNCTION` ×3, `DROP CONSTRAINT`, `DROP INDEX` —
  no data is rewritten, so it restores the 00029 state exactly.
- **IMP-002**: `relationship_roles_inverse_key_idx` is partial
  (`WHERE inverse_key IS NOT NULL`) and exists for the `ON DELETE SET NULL`
  probe, which searches by `(type_key, inverse_key)` — the PK leads with
  `(type_key, key)` and cannot serve it. Same reasoning as 00029 line 146.
- **IMP-003**: The FK is named `relationship_roles_inverse_key_fkey` rather than
  taking the generated `relationship_roles_type_key_inverse_key_fkey`, so it
  matches the shape the service already maps for types and an unknown inverse can
  be described in prose (`ROLE_WRITE_ERRORS` in `relationship-type-service.ts`).
- **IMP-004**: `supabase/tests/database/00031_relationship_role_inverse_integrity_test.sql`
  (33 assertions) covers involution after RPC writes, partner stealing, clearing,
  self-inversion, `ON DELETE SET NULL`, cross-type inverse rejection, duplicate
  create, not-found update, and both non-admin refusals.
- **IMP-005**: The stale comment on `roleFieldsSchema` in
  `packages/services/src/schemas/relationship-vocabulary.ts` — "deliberately not
  an FK in the schema" — is corrected by this change.
- **IMP-006**: The Supabase type generator does not model nullable function
  arguments, so `p_inverse_key` appears as `string` in `Database["public"]
["Functions"]["set_relationship_role"]["Args"]`. Callers passing `null` (the
  "clear the pairing" case) need a cast at the boundary.

## References

- **REF-001**: [ADR-0040](adr-0040-relationship-vocabulary-reference-data.md) —
  the reference-data refactor; it gave types a self-FK and left roles without one.
- **REF-002**: [ADR-0041](adr-0041-admin-only-surfaces-and-immutable-vocabulary-keys.md)
  — the admin surface these writes come from, and the reason key renames stay in
  SQL (so `ON UPDATE CASCADE` matters but is not a UI path).
- **REF-003**: [ADR-0009](adr-0009-relationship-sub-role-taxonomy.md) — the
  sub-role taxonomy whose reciprocal correctness depends on involution.
- **REF-004**: [ADR-0014](adr-0014-rls-single-source-of-authorization.md) and
  [ADR-0034](adr-0034-api-role-table-grants.md) — why the RPCs are
  `SECURITY INVOKER` and how they are granted.
- **REF-005**: `supabase/migrations/00026_delete_category_reparenting_children.sql`
  — the explicit-function-over-trigger precedent, and the `SECURITY INVOKER` +
  `search_path = ''` + revoke-from-anon shape copied here.
- **REF-006**: `supabase/migrations/00029_relationship_vocabulary.sql` lines
  82-84 (types self-FK), 102-114 (roles table), 166-198 (RLS).
- **REF-007**: PR #439 review, issue #428.

-- pgTAP tests for 00032_relationship_type_inverse_integrity.sql (the type-level
-- half of the gap 00031 closed for roles — relationship_types.inverse_key had a
-- self-FK but no enforcement that a pairing is two-sided, and the admin CRUD
-- from #428 is the first thing that ever writes one).
--
-- 00030_seed_relationship_vocabulary_test.sql line 148 asserts only that the
-- seeded corpus declares no inverse at all. This suite asserts involution over
-- *writes*: every pairing below is made through the new RPCs, on fixtures of
-- this suite's own (`t32_`-prefixed, so they never collide with the seeded
-- vocabulary or with the `t29_`/`t31_` fixtures).
--
-- Writes run as an impersonated admin (SET LOCAL ROLE authenticated + jwt
-- claims), not as postgres, because the whole point of SECURITY INVOKER here is
-- that RLS gates the RPC. The default postgres test role bypasses RLS.
--
-- set_relationship_type takes twelve arguments, ten of them defaulted, so every
-- call below uses named notation — a positional call would say almost nothing
-- about which columns the patch is stating.
begin;
create extension if not exists pgtap with schema extensions;

select plan(46);

-- ============================================================================
-- Schema: the self-FK this builds on, its probe index, and the new CHECK
-- ============================================================================

select fk_ok(
  'public', 'relationship_types', 'inverse_key',
  'public', 'relationship_types', 'key',
  'inverse_key is a self-FK (from 00029) — no dangling type inverses');

select has_index('public', 'relationship_types',
  'relationship_types_inverse_key_idx',
  'the referencing side is indexed for the ON DELETE SET NULL probe');

-- ============================================================================
-- Functions: signatures and security mode
-- ============================================================================

select has_function('public', 'set_relationship_type',
  array['character varying', 'text', 'character varying', 'integer', 'boolean',
        'text', 'boolean', 'boolean', 'character varying', 'text', 'text',
        'boolean'],
  'set_relationship_type exists with the partial-patch signature');

-- The defaults are the contract: a caller sends only the columns it changes.
select matches(
  pg_get_function_arguments(
    'public.set_relationship_type(varchar, text, varchar, int, bool, text, bool,
                                  bool, varchar, text, text, bool)'::regprocedure),
  'p_label text DEFAULT NULL::text',
  'p_label defaults to NULL — the "unchanged" sentinel');

select matches(
  pg_get_function_arguments(
    'public.set_relationship_type(varchar, text, varchar, int, bool, text, bool,
                                  bool, varchar, text, text, bool)'::regprocedure),
  'p_set_symmetry boolean DEFAULT false',
  'the symmetry quad is only written when the caller opts in explicitly');

select matches(
  pg_get_function_arguments(
    'public.set_relationship_type(varchar, text, varchar, int, bool, text, bool,
                                  bool, varchar, text, text, bool)'::regprocedure),
  'p_set_description boolean DEFAULT false',
  'description is nullable, so it gets its own opt-in flag');

-- create_relationship_type keeps full-value arguments: an INSERT has no prior
-- row to merge against, so there is nothing for a sentinel to mean.
select has_function('public', 'create_relationship_type',
  array['character varying', 'text', 'character varying', 'integer', 'boolean',
        'character varying', 'text', 'text', 'text', 'boolean'],
  'create_relationship_type takes the full row');

select has_function('public', 'pair_relationship_type_inverse',
  array['character varying', 'character varying'],
  'the pairing helper exists');

select is_empty(
  $$select proname from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('set_relationship_type', 'create_relationship_type',
                      'pair_relationship_type_inverse')
      and prosecdef$$,
  'all three functions are SECURITY INVOKER (RLS gates the writes)');

select ok(
  not has_function_privilege('anon',
    'public.set_relationship_type(varchar, text, varchar, int, bool, text, bool,
                                  bool, varchar, text, text, bool)',
    'EXECUTE'),
  'anon cannot execute set_relationship_type (read-only role)');

select ok(
  has_function_privilege('authenticated',
    'public.set_relationship_type(varchar, text, varchar, int, bool, text, bool,
                                  bool, varchar, text, text, bool)',
    'EXECUTE'),
  'authenticated may execute set_relationship_type (RLS gates it to admins)');

-- ============================================================================
-- Fixtures: an admin, a non-admin, and a small type vocabulary
--
-- is_symmetric DEFAULTs to true (00029 line 81), so every directed fixture sets
-- it false explicitly. t32_sym is the one deliberately symmetric type.
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
values
  ('32111111-3211-4211-8211-321111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   't32-admin@local', '', now(), now(), now(), 'authenticated', 'authenticated'),
  ('32222222-3222-4222-8222-322222222222'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   't32-editor@local', '', now(), now(), now(), 'authenticated', 'authenticated');

update public.profiles set role = 'admin'
  where id = '32111111-3211-4211-8211-321111111111';

insert into public.relationship_categories (key, label, sort_order)
  values ('t32_cat', 'T32 Category', 9120);

insert into public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb) values
  ('t32_a', 'T32 A', 't32_cat', 10, false, 'a-verb'),
  ('t32_b', 'T32 B', 't32_cat', 20, false, 'b-verb'),
  ('t32_c', 'T32 C', 't32_cat', 30, false, 'c-verb'),
  ('t32_d', 'T32 D', 't32_cat', 40, false, 'd-verb'),
  ('t32_g', 'T32 G', 't32_cat', 70, false, 'g-verb'),
  ('t32_h', 'T32 H', 't32_cat', 80, false, 'h-verb');

insert into public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, symmetric_noun)
  values ('t32_sym', 'T32 Symmetric', 't32_cat', 90, true, 'peer');

-- Renders the mutable columns of one t32 type as one string, so a partial-patch
-- assertion can say "nothing else moved" in a single test and report the whole
-- row on failure. Created before the role switch (an impersonated
-- `authenticated` may not CREATE) and rolled back with the suite.
create function t32_type_snapshot(p_key varchar) returns text
language sql stable as $fn$
  select label || ' | ' || sort_order || ' | ' || is_active
         || ' | ' || is_symmetric
         || ' | ' || coalesce(inverse_key, '(none)')
         || ' | ' || coalesce(direction_verb, '(none)')
         || ' | ' || coalesce(description, '(none)')
    from public.relationship_types
   where key = p_key;
$fn$;

-- ============================================================================
-- FK behaviour on plain writes (the RPCs are not the only write path)
-- ============================================================================

select throws_ok(
  $$update public.relationship_types set inverse_key = 'nope'
     where key = 't32_a'$$,
  '23503', null,
  'an inverse naming no existing type is rejected by the FK');

-- Unlike roles, where self-inversion IS the symmetric encoding, a type says
-- "my reciprocal is me" with is_symmetric. See ADR-0043 ALT-003.
select throws_ok(
  $$update public.relationship_types set inverse_key = 't32_a'
     where key = 't32_a'$$,
  '23514', null,
  'a type may not be its own inverse — is_symmetric expresses that');

-- ============================================================================
-- Involution through the RPC, as an admin
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub":"32111111-3211-4211-8211-321111111111"}';

select is(
  (select inverse_key from public.set_relationship_type(
     p_key => 't32_a', p_label => 'A renamed',
     p_is_symmetric => false, p_inverse_key => 't32_b',
     p_direction_verb => 'a-verb', p_set_symmetry => true)),
  't32_b',
  'set_relationship_type returns the row it wrote');

select is(
  (select label from public.relationship_types where key = 't32_a'),
  'A renamed',
  'a stated column is written');

select is(
  (select inverse_key from public.relationship_types where key = 't32_b'),
  't32_a',
  'the partner is pointed back at the target — involution holds after a write');

-- ---- Stealing: c already claims b; a takes b ----

select public.set_relationship_type(
  p_key => 't32_c', p_is_symmetric => false, p_inverse_key => 't32_b',
  p_direction_verb => 'c-verb', p_set_symmetry => true);

select is(
  (select inverse_key from public.relationship_types where key = 't32_a'),
  null,
  'c taking b releases a, which was b''s previous partner');

select public.set_relationship_type(
  p_key => 't32_a', p_is_symmetric => false, p_inverse_key => 't32_b',
  p_direction_verb => 'a-verb', p_set_symmetry => true);

select is(
  (select inverse_key from public.relationship_types where key = 't32_c'),
  null,
  'a taking b back clears c — the stolen partner leaves no second claimant');

select is(
  (select inverse_key from public.relationship_types where key = 't32_b'),
  't32_a',
  'and b names its new partner');

-- ---- Clearing: opting in with a NULL inverse releases the partner ----

select public.set_relationship_type(
  p_key => 't32_a', p_is_symmetric => false, p_inverse_key => null,
  p_direction_verb => 'a-verb', p_set_symmetry => true);

select is(
  (select inverse_key from public.relationship_types where key = 't32_a'),
  null,
  'p_set_symmetry => true with a NULL inverse clears the pairing');

select is(
  (select inverse_key from public.relationship_types where key = 't32_b'),
  null,
  'clearing a''s inverse clears b''s back-reference too');

-- ---- The two states the type level rejects outright ----

-- Writing back to a symmetric partner would violate
-- relationship_types_symmetric_has_no_inverse on a row the admin never edited,
-- so the helper refuses first and names the offending type.
select throws_ok(
  $$select public.set_relationship_type(
      p_key => 't32_a', p_is_symmetric => false, p_inverse_key => 't32_sym',
      p_direction_verb => 'a-verb', p_set_symmetry => true)$$,
  '22023', null,
  'a symmetric type cannot be named as an inverse');

select throws_ok(
  $$select public.set_relationship_type(
      p_key => 't32_a', p_is_symmetric => false, p_inverse_key => 't32_a',
      p_direction_verb => 'a-verb', p_set_symmetry => true)$$,
  '23514', null,
  'a type cannot be made its own inverse through the RPC either');

-- ---- Creation pairs atomically too ----

select is(
  (select inverse_key from public.create_relationship_type(
     p_key => 't32_e', p_label => 'T32 E', p_category_key => 't32_cat',
     p_sort_order => 50, p_is_symmetric => false, p_inverse_key => 't32_d',
     p_direction_verb => 'e-verb', p_symmetric_noun => null,
     p_description => null, p_is_active => true)),
  't32_d',
  'create_relationship_type accepts an inverse naming an existing type');

select is(
  (select inverse_key from public.relationship_types where key = 't32_d'),
  't32_e',
  'and that type is pointed back at the new one in the same transaction');

select throws_ok(
  $$select public.create_relationship_type(
      p_key => 't32_e', p_label => 'Duplicate', p_category_key => 't32_cat',
      p_sort_order => 60, p_is_symmetric => false, p_inverse_key => null,
      p_direction_verb => 'dup-verb', p_symmetric_noun => null,
      p_description => null, p_is_active => true)$$,
  '23505', null,
  'creating a type whose key is taken still raises a duplicate-key error');

select throws_ok(
  $$select public.set_relationship_type(
      p_key => 't32_no_such_type', p_label => 'Missing')$$,
  'P0002', null,
  'updating a type that does not exist raises not-found');

-- ============================================================================
-- Partial patches: an omitted argument leaves its column exactly as it was
--
-- This is the property the merge-under-the-lock design exists for. The previous
-- shape read the row in a separate, unlocked round trip so the service could
-- evaluate the symmetry invariant against the merged row, so two admins patching
-- different columns of the same type could each write a stale snapshot and
-- silently revert the other (ADR-0042 NEG-003, same defect one level up).
-- Concurrency itself is not reproducible in pgTAP — a single backend, one
-- transaction — so these assertions stand in for it: if no column the caller did
-- not name is ever written, there is nothing to lose.
-- ============================================================================

select public.set_relationship_type(
  p_key => 't32_g', p_is_symmetric => false, p_inverse_key => 't32_h',
  p_direction_verb => 'g-verb', p_set_symmetry => true);

-- (1) label only — the "rename" patch from the admin form.
select public.set_relationship_type(p_key => 't32_g', p_label => 'G renamed');

select is(
  t32_type_snapshot('t32_g'),
  'G renamed | 70 | true | false | t32_h | g-verb | (none)',
  'a label-only patch leaves the symmetry quad, sort_order and is_active alone');

-- (2) is_active only — the toggleActive() patch, the call that exposed the bug.
select public.set_relationship_type(p_key => 't32_g', p_is_active => false);

select is(
  t32_type_snapshot('t32_g'),
  'G renamed | 70 | false | false | t32_h | g-verb | (none)',
  'an is_active-only patch leaves label, sort_order and the quad alone');

-- (3) sort_order only — the ▲▼ reorder patch.
select public.set_relationship_type(p_key => 't32_g', p_sort_order => 75);

select is(
  t32_type_snapshot('t32_g'),
  'G renamed | 75 | false | false | t32_h | g-verb | (none)',
  'a sort_order-only patch leaves label, is_active and the quad alone');

-- (4) every argument omitted: addressing a row without stating a column is a
-- no-op that still returns the row, not a wipe of the mutable columns.
select is(
  (select label from public.set_relationship_type(p_key => 't32_g')),
  'G renamed',
  'a patch stating no columns returns the unchanged row');

select is(
  t32_type_snapshot('t32_g'),
  'G renamed | 75 | false | false | t32_h | g-verb | (none)',
  'and writes nothing');

-- (5) the quad without the opt-in flag is ignored — including an inverse the FK
-- would have rejected, which proves the column was never written.
select public.set_relationship_type(
  p_key => 't32_g', p_inverse_key => 't32_no_such_type', p_is_symmetric => true);

select is(
  (select inverse_key from public.relationship_types where key = 't32_g'),
  't32_h',
  'the quad is ignored while p_set_symmetry is false');

select is(
  (select inverse_key from public.relationship_types where key = 't32_h'),
  't32_g',
  'and the partner keeps its back-reference — the pairing helper did not run');

-- (6) description has its own flag, on the same "NULL is a real value" grounds.
select public.set_relationship_type(
  p_key => 't32_g', p_description => 'A description', p_set_description => true);

select is(
  t32_type_snapshot('t32_g'),
  'G renamed | 75 | false | false | t32_h | g-verb | A description',
  'p_set_description => true writes the column');

select public.set_relationship_type(p_key => 't32_g', p_description => null);

select is(
  (select description from public.relationship_types where key = 't32_g'),
  'A description',
  'a NULL p_description does not clear it without the opt-in flag');

-- (7) with the flag, a NULL inverse clears the pairing — on both sides.
select public.set_relationship_type(
  p_key => 't32_g', p_is_symmetric => false, p_inverse_key => null,
  p_direction_verb => 'g-verb', p_set_symmetry => true);

select is(
  t32_type_snapshot('t32_g'),
  'G renamed | 75 | false | false | (none) | g-verb | A description',
  'p_set_symmetry => true clears inverse_key and still leaves the rest alone');

select is(
  (select inverse_key from public.relationship_types where key = 't32_h'),
  null,
  'and the partner is released');

-- (8) a rejected value still fails once the caller opts in, so the flag is not
-- a way to smuggle a bad reference past the FK.
select throws_ok(
  $$select public.set_relationship_type(
      p_key => 't32_g', p_is_symmetric => false,
      p_inverse_key => 't32_no_such_type', p_direction_verb => 'g-verb',
      p_set_symmetry => true)$$,
  '23503', null,
  'an opted-in inverse naming no existing type is still rejected by the FK');

-- ============================================================================
-- Involution corpus-wide, after all of the above writes
-- ============================================================================

reset role; reset request.jwt.claims;

select is_empty(
  $$select r.key
      from public.relationship_types r
      join public.relationship_types inv on inv.key = r.inverse_key
     where inv.inverse_key is distinct from r.key$$,
  'inverse(inverse(x)) = x across the whole table after RPC writes');

-- ============================================================================
-- ON DELETE SET NULL: deleting a type releases the one that named it
-- ============================================================================

delete from public.relationship_types where key = 't32_e';

select is(
  (select inverse_key from public.relationship_types where key = 't32_d'),
  null,
  'deleting a type clears the back-reference that pointed at it');

select is(
  (select count(*)::int from public.relationship_types where key = 't32_d'),
  1,
  'and the partner itself survives — only the reference is nulled');

-- ============================================================================
-- Authorization: the RPCs are gated by the same is_admin() RLS as plain writes
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub":"32222222-3222-4222-8222-322222222222"}';

-- A plain UPDATE is filtered to zero rows for a non-admin; inside the function
-- that same filtering makes the target unfindable, which surfaces as not-found.
select throws_ok(
  $$select public.set_relationship_type(
      p_key => 't32_a', p_label => 'Hijacked')$$,
  'P0002', null,
  'a non-admin cannot update through set_relationship_type');

select throws_ok(
  $$select public.create_relationship_type(
      p_key => 't32_f', p_label => 'T32 F', p_category_key => 't32_cat',
      p_sort_order => 60, p_is_symmetric => false, p_inverse_key => null,
      p_direction_verb => 'f-verb', p_symmetric_noun => null,
      p_description => null, p_is_active => true)$$,
  '42501', null,
  'a non-admin cannot insert through create_relationship_type (RLS refusal)');

reset role; reset request.jwt.claims;

select is(
  (select label from public.relationship_types where key = 't32_a'),
  'A renamed',
  'the non-admin attempt left the target row untouched');

select is(
  (select count(*)::int from public.relationship_types where key = 't32_f'),
  0,
  'and created nothing');

select * from finish();
rollback;

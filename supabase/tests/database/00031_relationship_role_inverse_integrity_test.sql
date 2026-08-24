-- pgTAP tests for 00031_relationship_role_inverse_integrity.sql (PR #439 review
-- — relationship_roles.inverse_key had neither an FK nor any enforcement that a
-- pairing is two-sided).
--
-- 00030_seed_relationship_vocabulary_test.sql lines 134-140 assert involution
-- over the *seeded* corpus. This suite asserts it over *writes*: every pairing
-- below is made through the new RPCs, on fixtures of this suite's own
-- (`t31_`-prefixed, so they never collide with the seeded vocabulary or with
-- 00029's `t29_` fixtures).
--
-- Writes run as an impersonated admin (SET LOCAL ROLE authenticated + jwt
-- claims), not as postgres, because the whole point of SECURITY INVOKER here is
-- that RLS gates the RPC. The default postgres test role bypasses RLS.
begin;
create extension if not exists pgtap with schema extensions;

-- Positional argument order for set_relationship_role, used throughout below:
--   (p_type_key, p_key, p_label, p_inverse_key, p_set_inverse_key,
--    p_sort_order, p_is_active)
-- Every argument after p_key defaults to "leave this column alone"
-- (NULL, and false for p_set_inverse_key); named notation is used wherever a
-- call deliberately omits some of them.
select plan(49);

-- ============================================================================
-- Schema: the composite self-FK and its probe index
-- ============================================================================

select fk_ok(
  'public', 'relationship_roles', array['type_key', 'inverse_key'],
  'public', 'relationship_roles', array['type_key', 'key'],
  'inverse_key is a composite self-FK scoped by type_key');

-- ON DELETE SET NULL must name the column: the constraint spans type_key too,
-- and type_key is NOT NULL, so a bare SET NULL would fail on every delete.
select matches(
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.relationship_roles'::regclass
      and conname = 'relationship_roles_inverse_key_fkey'),
  'ON DELETE SET NULL \(inverse_key\)',
  'the FK nulls only inverse_key on delete, not the whole key pair');

select matches(
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.relationship_roles'::regclass
      and conname = 'relationship_roles_inverse_key_fkey'),
  'ON UPDATE CASCADE',
  'renaming a role key follows into its partner''s inverse_key');

select has_index('public', 'relationship_roles',
  'relationship_roles_inverse_key_idx',
  'the referencing side is indexed for the ON DELETE SET NULL probe');

-- Self-inversion is the sanctioned encoding for a symmetric role, so no
-- "inverse_key <> key" CHECK exists — 16 of the 32 seeded roles rely on it.
select is(
  (select inverse_key from public.relationship_roles
    where type_key = 'family' and key = 'spouse'),
  'spouse',
  'a self-inverse role is legal (spouse <-> spouse), and survives the new FK');

-- ============================================================================
-- Functions: signatures and security mode
-- ============================================================================

select has_function('public', 'set_relationship_role',
  array['character varying', 'character varying', 'text',
        'character varying', 'boolean', 'integer', 'boolean'],
  'set_relationship_role exists with the partial-patch signature');

-- The defaults are the contract: a caller sends only the columns it changes.
select matches(
  pg_get_function_arguments(
    'public.set_relationship_role(varchar, varchar, text, varchar, bool, int, bool)'::regprocedure),
  'p_label text DEFAULT NULL::text',
  'p_label defaults to NULL — the "unchanged" sentinel');

select matches(
  pg_get_function_arguments(
    'public.set_relationship_role(varchar, varchar, text, varchar, bool, int, bool)'::regprocedure),
  'p_set_inverse_key boolean DEFAULT false',
  'inverse_key is only written when the caller opts in explicitly');

select matches(
  pg_get_function_arguments(
    'public.set_relationship_role(varchar, varchar, text, varchar, bool, int, bool)'::regprocedure),
  'p_sort_order integer DEFAULT NULL::integer',
  'p_sort_order defaults to NULL — the "unchanged" sentinel');

select matches(
  pg_get_function_arguments(
    'public.set_relationship_role(varchar, varchar, text, varchar, bool, int, bool)'::regprocedure),
  'p_is_active boolean DEFAULT NULL::boolean',
  'p_is_active defaults to NULL — the "unchanged" sentinel');

-- create_relationship_role keeps full-value arguments: an INSERT has no prior
-- row to merge against, so there is nothing for a sentinel to mean.
select has_function('public', 'create_relationship_role',
  array['character varying', 'character varying', 'text',
        'character varying', 'integer', 'boolean'],
  'create_relationship_role still takes the full row');

select has_function('public', 'pair_relationship_role_inverse',
  array['character varying', 'character varying', 'character varying'],
  'the pairing helper exists');

select is_empty(
  $$select proname from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('set_relationship_role', 'create_relationship_role',
                      'pair_relationship_role_inverse')
      and prosecdef$$,
  'all three functions are SECURITY INVOKER (RLS gates the writes)');

select ok(
  not has_function_privilege('anon',
    'public.set_relationship_role(varchar, varchar, text, varchar, bool, int, bool)',
    'EXECUTE'),
  'anon cannot execute set_relationship_role (read-only role)');

select ok(
  has_function_privilege('authenticated',
    'public.set_relationship_role(varchar, varchar, text, varchar, bool, int, bool)',
    'EXECUTE'),
  'authenticated may execute set_relationship_role (RLS gates it to admins)');

-- ============================================================================
-- Fixtures: an admin, a non-admin, and a four-role vocabulary
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
values
  ('31111111-3111-4111-8111-311111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   't31-admin@local', '', now(), now(), now(), 'authenticated', 'authenticated'),
  ('31222222-3122-4122-8122-312222222222'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   't31-editor@local', '', now(), now(), now(), 'authenticated', 'authenticated');

update public.profiles set role = 'admin'
  where id = '31111111-3111-4111-8111-311111111111';

insert into public.relationship_categories (key, label, sort_order)
  values ('t31_cat', 'T31 Category', 9110);

insert into public.relationship_types (key, label, category_key, sort_order)
  values ('t31_type', 'T31 Type', 't31_cat', 10),
         ('t31_other_type', 'T31 Other Type', 't31_cat', 20);

insert into public.relationship_roles (type_key, key, label, sort_order) values
  ('t31_type', 'a', 'A', 10),
  ('t31_type', 'b', 'B', 20),
  ('t31_type', 'c', 'C', 30),
  ('t31_type', 'd', 'D', 40),
  ('t31_type', 'g', 'G', 70),
  ('t31_type', 'h', 'H', 80),
  ('t31_other_type', 'x', 'X', 10);

-- Renders all four mutable columns of one t31_type role as one string, so a
-- partial-patch assertion can say "nothing else moved" in a single test and
-- report the whole row on failure. Created before the role switch (an
-- impersonated `authenticated` may not CREATE) and rolled back with the suite.
create function t31_role_snapshot(p_key varchar) returns text
language sql stable as $fn$
  select label || ' | ' || coalesce(inverse_key, '(none)')
         || ' | ' || sort_order || ' | ' || is_active
    from public.relationship_roles
   where type_key = 't31_type' and key = p_key;
$fn$;

-- ============================================================================
-- FK behaviour on plain writes (the RPCs are not the only write path)
-- ============================================================================

select throws_ok(
  $$update public.relationship_roles set inverse_key = 'nope'
     where type_key = 't31_type' and key = 'a'$$,
  '23503', null,
  'an inverse naming no existing role is rejected by the FK');

select throws_ok(
  $$update public.relationship_roles set inverse_key = 'x'
     where type_key = 't31_type' and key = 'a'$$,
  '23503', null,
  'an inverse naming a role of another type is rejected (pairing is type-scoped)');

-- ============================================================================
-- Involution through the RPC, as an admin
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub":"31111111-3111-4111-8111-311111111111"}';

select is(
  (select inverse_key from public.set_relationship_role(
     't31_type', 'a', 'A renamed', 'b', true, 15, true)),
  'b',
  'set_relationship_role returns the row it wrote');

select is(
  (select label from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  'A renamed',
  'a stated column is written');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'b'),
  'a',
  'the partner is pointed back at the target — involution holds after a write');

-- ---- Stealing: c already claims b; a takes b ----

select public.set_relationship_role('t31_type', 'c', 'C', 'b', true, 30, true);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  null,
  'c taking b releases a, which was b''s previous partner');

select public.set_relationship_role('t31_type', 'a', 'A', 'b', true, 15, true);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'c'),
  null,
  'a taking b back clears c — the stolen partner leaves no second claimant');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'b'),
  'a',
  'and b names its new partner');

-- ---- Clearing: opting in with a NULL inverse releases the partner ----

select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'a',
  p_inverse_key => null, p_set_inverse_key => true);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  null,
  'p_set_inverse_key => true with a NULL inverse clears the pairing');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'b'),
  null,
  'clearing a''s inverse clears b''s back-reference too');

-- ---- Self-inversion through the RPC (the symmetric-role encoding) ----

select public.set_relationship_role('t31_type', 'b', 'B', 'a', true, 20, true);
select public.set_relationship_role('t31_type', 'a', 'A', 'a', true, 15, true);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  'a',
  'a role may be its own inverse (symmetric role)');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'b'),
  null,
  'becoming self-inverse releases the former partner rather than stranding it');

-- ---- Creation pairs atomically too ----

select is(
  (select inverse_key from public.create_relationship_role(
     't31_type', 'e', 'E', 'd', 50, true)),
  'd',
  'create_relationship_role accepts an inverse naming an existing sibling');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'd'),
  'e',
  'and the sibling is pointed back at the new role in the same transaction');

select throws_ok(
  $$select public.create_relationship_role(
      't31_type', 'e', 'Duplicate', null, 60, true)$$,
  '23505', null,
  'creating a role whose key is taken still raises a duplicate-key error');

select throws_ok(
  $$select public.set_relationship_role(
      't31_type', 'no_such_role', 'Missing', null, false, 0, true)$$,
  'P0002', null,
  'updating a role that does not exist raises not-found');

-- ============================================================================
-- Partial patches: an omitted argument leaves its column exactly as it was
--
-- This is the property the merge-under-the-lock design exists for. The earlier
-- shape made the service read the row in a separate, unlocked round trip and
-- send back a whole merged row, so two admins patching different columns of the
-- same role could each write a stale snapshot and silently revert the other
-- (PR #439 review). Concurrency itself is not reproducible in pgTAP — a single
-- backend, one transaction — so these assertions stand in for it: if no column
-- the caller did not name is ever written, there is nothing to lose.
-- ============================================================================

select public.set_relationship_role('t31_type', 'g', 'G', 'h', true, 70, true);

-- (1) label only — the "rename" patch from the admin form.
select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'g', p_label => 'G renamed');

select is(
  t31_role_snapshot('g'),
  'G renamed | h | 70 | true',
  'a label-only patch leaves inverse_key, sort_order and is_active untouched');

-- (2) is_active only — the toggleActive() patch, the call that exposed the bug.
select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'g', p_is_active => false);

select is(
  t31_role_snapshot('g'),
  'G renamed | h | 70 | false',
  'an is_active-only patch leaves label, inverse_key and sort_order untouched');

-- (3) sort_order only.
select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'g', p_sort_order => 75);

select is(
  t31_role_snapshot('g'),
  'G renamed | h | 75 | false',
  'a sort_order-only patch leaves label, inverse_key and is_active untouched');

-- (4) every argument omitted: addressing a row without stating a column is a
-- no-op that still returns the row, not a wipe of the four mutable columns.
select is(
  (select label from public.set_relationship_role(
     p_type_key => 't31_type', p_key => 'g')),
  'G renamed',
  'a patch stating no columns returns the unchanged row');

select is(
  t31_role_snapshot('g'),
  'G renamed | h | 75 | false',
  'and writes nothing');

-- (5) p_inverse_key without the opt-in flag is ignored — including a value the
-- FK would have rejected, which proves the column was never written.
select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'g', p_inverse_key => 'no_such_role');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'g'),
  'h',
  'p_inverse_key is ignored while p_set_inverse_key is false');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'h'),
  'g',
  'and the partner keeps its back-reference — the pairing helper did not run');

-- (6) the same, with an explicit NULL: "unstated" and "clear it" are distinct.
select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'g',
  p_inverse_key => null, p_set_inverse_key => false);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'g'),
  'h',
  'a NULL p_inverse_key does not clear the pairing without the opt-in flag');

-- (7) with the flag, the same NULL does clear it — on both sides.
select public.set_relationship_role(
  p_type_key => 't31_type', p_key => 'g',
  p_inverse_key => null, p_set_inverse_key => true);

select is(
  t31_role_snapshot('g'),
  'G renamed | (none) | 75 | false',
  'p_set_inverse_key => true clears inverse_key and still leaves the rest alone');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'h'),
  null,
  'and the partner is released');

-- (8) a rejected value still fails once the caller opts in, so the flag is not
-- a way to smuggle a bad reference past the FK.
select throws_ok(
  $$select public.set_relationship_role(
      p_type_key => 't31_type', p_key => 'g',
      p_inverse_key => 'no_such_role', p_set_inverse_key => true)$$,
  '23503', null,
  'an opted-in inverse naming no existing role is still rejected by the FK');

-- ============================================================================
-- Involution corpus-wide, after all of the above writes
-- ============================================================================

reset role; reset request.jwt.claims;

select is_empty(
  $$select r.type_key || '.' || r.key
      from public.relationship_roles r
      join public.relationship_roles inv
        on inv.type_key = r.type_key and inv.key = r.inverse_key
     where inv.inverse_key is distinct from r.key$$,
  'inverse(inverse(x)) = x across the whole table after RPC writes');

-- ============================================================================
-- ON DELETE SET NULL: deleting a role releases the sibling that named it
-- ============================================================================

delete from public.relationship_roles where type_key = 't31_type' and key = 'e';

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'd'),
  null,
  'deleting a role clears the sibling back-reference that pointed at it');

select is(
  (select count(*)::int from public.relationship_roles
    where type_key = 't31_type' and key = 'd'),
  1,
  'and the sibling itself survives — only the reference is nulled');

-- ============================================================================
-- Authorization: the RPCs are gated by the same is_admin() RLS as plain writes
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub":"31222222-3122-4122-8122-312222222222"}';

-- A plain UPDATE is filtered to zero rows for a non-admin; inside the function
-- that same filtering makes the target unfindable, which surfaces as not-found.
select throws_ok(
  $$select public.set_relationship_role(
      't31_type', 'a', 'Hijacked', null, false, 99, false)$$,
  'P0002', null,
  'a non-admin cannot update through set_relationship_role');

select throws_ok(
  $$select public.create_relationship_role(
      't31_type', 'f', 'F', null, 60, true)$$,
  '42501', null,
  'a non-admin cannot insert through create_relationship_role (RLS refusal)');

reset role; reset request.jwt.claims;

select is(
  (select label from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  'A',
  'the non-admin attempt left the target row untouched');

select is(
  (select count(*)::int from public.relationship_roles
    where type_key = 't31_type' and key = 'f'),
  0,
  'and created nothing');

select * from finish();
rollback;

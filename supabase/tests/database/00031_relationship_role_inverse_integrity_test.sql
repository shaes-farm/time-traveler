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

select plan(33);

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
        'character varying', 'integer', 'boolean'],
  'set_relationship_role exists with the full-replacement signature');

select has_function('public', 'create_relationship_role',
  array['character varying', 'character varying', 'text',
        'character varying', 'integer', 'boolean'],
  'create_relationship_role exists with the same signature');

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
    'public.set_relationship_role(varchar, varchar, text, varchar, int, bool)',
    'EXECUTE'),
  'anon cannot execute set_relationship_role (read-only role)');

select ok(
  has_function_privilege('authenticated',
    'public.set_relationship_role(varchar, varchar, text, varchar, int, bool)',
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
  ('t31_other_type', 'x', 'X', 10);

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
     't31_type', 'a', 'A renamed', 'b', 15, true)),
  'b',
  'set_relationship_role returns the row it wrote');

select is(
  (select label from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  'A renamed',
  'the target''s own fields are replaced wholesale');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'b'),
  'a',
  'the partner is pointed back at the target — involution holds after a write');

-- ---- Stealing: c already claims b; a takes b ----

select public.set_relationship_role('t31_type', 'c', 'C', 'b', 30, true);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'a'),
  null,
  'c taking b releases a, which was b''s previous partner');

select public.set_relationship_role('t31_type', 'a', 'A', 'b', 15, true);

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

-- ---- Clearing: setting the inverse to NULL releases the partner ----

select public.set_relationship_role('t31_type', 'a', 'A', null, 15, true);

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 't31_type' and key = 'b'),
  null,
  'clearing a''s inverse clears b''s back-reference too');

-- ---- Self-inversion through the RPC (the symmetric-role encoding) ----

select public.set_relationship_role('t31_type', 'b', 'B', 'a', 20, true);
select public.set_relationship_role('t31_type', 'a', 'A', 'a', 15, true);

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
      't31_type', 'no_such_role', 'Missing', null, 0, true)$$,
  'P0002', null,
  'updating a role that does not exist raises not-found');

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
      't31_type', 'a', 'Hijacked', null, 99, false)$$,
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

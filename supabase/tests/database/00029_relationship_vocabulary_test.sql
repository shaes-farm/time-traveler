-- pgTAP tests for 00029_relationship_vocabulary.sql (issue #419 — the
-- relationship vocabulary moves from a hard-coded CHECK to reference tables
-- with FKs, so new types are INSERTs rather than migrations).
--
-- 00029 seeds no rows by design (content ships in 00030), so this suite builds
-- its own vocabulary fixtures — the same approach 00028 takes.
begin;
create extension if not exists pgtap with schema extensions;

select plan(32);

-- ============================================================================
-- Tables exist
-- ============================================================================

select has_table('public', 'relationship_categories', 'relationship_categories exists');
select has_table('public', 'relationship_types',      'relationship_types exists');
select has_table('public', 'relationship_roles',      'relationship_roles exists');

select col_is_pk('public', 'relationship_categories', 'key',
  'relationship_categories PK is the natural text key');
select col_is_pk('public', 'relationship_types', 'key',
  'relationship_types PK is the natural text key');
select col_is_pk('public', 'relationship_roles', array['type_key', 'key'],
  'relationship_roles PK is composite (type_key, key) — also the FK target');

-- ============================================================================
-- Constraint shape: 3 CHECKs collapsed into 2 FKs
-- ============================================================================

select fk_ok(
  'public', 'relationship_types',      array['category_key'],
  'public', 'relationship_categories', array['key'],
  'relationship_types.category_key -> relationship_categories.key');

select fk_ok(
  'public', 'character_relationships', array['relationship_type'],
  'public', 'relationship_types',      array['key'],
  'character_relationships.relationship_type -> relationship_types.key');

select fk_ok(
  'public', 'character_relationships', array['relationship_type', 'relationship_role'],
  'public', 'relationship_roles',      array['type_key', 'key'],
  'composite (relationship_type, relationship_role) -> relationship_roles');

-- A CHECK is a constraint, not an index, so this has to query pg_constraint —
-- hasnt_index() would pass vacuously whether or not the constraint survived.
select is_empty(
  $$select conname from pg_constraint
    where conrelid = 'public.character_relationships'::regclass
      and conname = 'character_relationships_relationship_type_check'$$,
  'the 00002 relationship_type CHECK is gone');

select has_index('public', 'character_relationships',
  'character_relationships_relationship_type_idx',
  'relationship_type is indexed for the ON DELETE RESTRICT probe');

-- The two 00014 role CHECKs are replaced by the composite FK.
select is_empty(
  $$select conname from pg_constraint
    where conrelid = 'public.character_relationships'::regclass
      and conname in ('relationship_role_valid',
                      'relationship_role_null_for_other_types')$$,
  'both 00014 relationship_role CHECKs are dropped');

-- The self-relationship CHECK from 00002 is untouched.
select isnt_empty(
  $$select conname from pg_constraint
    where conrelid = 'public.character_relationships'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%character_id%related_character_id%'$$,
  'the character_id != related_character_id CHECK survives');

-- ============================================================================
-- Fixtures: a minimal vocabulary + two characters
-- ============================================================================

insert into public.relationship_categories (key, label, sort_order)
  values ('t29_social', 'T29 Social', 9010), ('t29_causal', 'T29 Causal', 9020);

insert into public.relationship_types
  (key, label, category_key, is_symmetric, sort_order)
  values
  ('t29_roled',   'T29 Roled',   't29_social', true,  10),
  ('t29_roleless','T29 Roleless','t29_social', true,  20),
  ('t29_directed','T29 Directed','t29_causal', false, 10),
  -- Never referenced by a relationship below — proves RESTRICT blocks only
  -- types that are actually in use.
  ('t29_unused',  'T29 Unused',  't29_causal', false, 20);

insert into public.relationship_roles (type_key, key, label, inverse_key)
  values
  ('t29_roled', 'parent', 'Parent', 'child'),
  ('t29_roled', 'child',  'Child',  'parent');

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'vocab@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into public.characters (user_id, slug, name, character_type) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'vocab-a', 'A', 'human'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'vocab-b', 'B', 'human');

-- ============================================================================
-- relationship_type FK behaviour
-- ============================================================================

select lives_ok(
  $$insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
            (select id from public.characters where slug = 'vocab-a'),
            (select id from public.characters where slug = 'vocab-b'),
            't29_directed')$$,
  'a type present in the vocabulary is accepted');

select throws_ok(
  $$insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
            (select id from public.characters where slug = 'vocab-a'),
            (select id from public.characters where slug = 'vocab-b'),
            'not_a_real_type')$$,
  '23503', null,
  'an unknown relationship_type is rejected by the FK (23503, was 23514)');

-- ============================================================================
-- Composite FK: NULL role always allowed (MATCH SIMPLE), pairs validated
-- ============================================================================

select lives_ok(
  $$insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
            (select id from public.characters where slug = 'vocab-a'),
            (select id from public.characters where slug = 'vocab-b'),
            't29_roleless', null)$$,
  'NULL role is accepted for a type with no roles (MATCH SIMPLE skip)');

select lives_ok(
  $$insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
            (select id from public.characters where slug = 'vocab-a'),
            (select id from public.characters where slug = 'vocab-b'),
            't29_roled', 'parent')$$,
  'a valid (type, role) pair is accepted');

select throws_ok(
  $$insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
            (select id from public.characters where slug = 'vocab-a'),
            (select id from public.characters where slug = 'vocab-b'),
            't29_directed', 'parent')$$,
  '23503', null,
  'a role belonging to another type is rejected');

select throws_ok(
  $$insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
            (select id from public.characters where slug = 'vocab-a'),
            (select id from public.characters where slug = 'vocab-b'),
            't29_roled', 'not_a_real_role')$$,
  '23503', null,
  'an unknown role is rejected');

-- ============================================================================
-- RESTRICT protects in-use vocabulary; CASCADE cleans up roles
-- ============================================================================

select throws_ok(
  $$delete from public.relationship_types where key = 't29_directed'$$,
  '23503', null,
  'deleting an in-use relationship_type is blocked by ON DELETE RESTRICT');

select throws_ok(
  $$delete from public.relationship_categories where key = 't29_social'$$,
  '23503', null,
  'deleting a category with types is blocked by ON DELETE RESTRICT');

select lives_ok(
  $$delete from public.relationship_types where key = 't29_unused'$$,
  'an unused relationship_type can be deleted');

-- ============================================================================
-- symmetric/inverse invariant
-- ============================================================================

select throws_ok(
  $$insert into public.relationship_types (key, label, category_key, is_symmetric, inverse_key)
    values ('t29_bad_sym', 'Bad', 't29_social', true, 't29_roled')$$,
  '23514', null,
  'a symmetric type cannot also name an inverse');

select lives_ok(
  $$insert into public.relationship_types (key, label, category_key, is_symmetric, inverse_key)
    values ('t29_good_asym', 'Good', 't29_causal', false, 't29_roled')$$,
  'an asymmetric type may name an inverse');

-- ============================================================================
-- RLS + GRANTs
-- ============================================================================

select is_empty(
  $$select tablename from pg_tables
    where schemaname = 'public'
      and tablename in ('relationship_categories','relationship_types','relationship_roles')
      and rowsecurity = false$$,
  'RLS is enabled on all three vocabulary tables');

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public'
      and tablename in ('relationship_categories','relationship_types','relationship_roles')),
  12,
  'four policies (read/insert/update/delete) on each of the three tables');

select is_empty(
  $$select tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('relationship_categories','relationship_types','relationship_roles')
      and cmd = 'SELECT' and qual <> 'true'$$,
  'every read policy is USING (true) — vocabulary is globally readable');

select ok(
  has_table_privilege('anon', 'public.relationship_types', 'SELECT'),
  'anon can read relationship_types');
select ok(
  not has_table_privilege('anon', 'public.relationship_types', 'INSERT'),
  'anon cannot write relationship_types');
select ok(
  has_table_privilege('authenticated', 'public.relationship_types', 'INSERT'),
  'authenticated is granted INSERT (RLS gates it to admins)');
select ok(
  has_table_privilege('service_role', 'public.relationship_roles', 'DELETE'),
  'service_role has full DML on relationship_roles');
select ok(
  has_table_privilege('anon', 'public.relationship_categories', 'SELECT'),
  'anon can read relationship_categories');

-- Note: this suite no longer asserts that 00029 seeds nothing. Migrations run
-- in sequence, so by the time any test executes, 00030 has populated the
-- vocabulary — "00029 alone seeds nothing" is not observable at runtime. The
-- seeded content is asserted in 00030_seed_relationship_vocabulary_test.sql;
-- fixtures here are `t29_`-prefixed so they never collide with it.

select * from finish();
rollback;

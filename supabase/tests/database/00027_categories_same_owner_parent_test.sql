-- pgTAP tests for 00027_categories_same_owner_parent.sql (issue #59 / PR #338 —
-- category nesting is constrained to a single owner via a composite FK).
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

-- ============================================================================
-- Constraint shape
-- ============================================================================

select col_is_unique('categories', array['user_id', 'id'],
  'categories has a UNIQUE (user_id, id) key for the composite FK to target');

select fk_ok(
  'public', 'categories', array['user_id', 'parent_category_id'],
  'public', 'categories', array['user_id', 'id'],
  'parent link is an owner-scoped composite FK (user_id, parent_category_id)'
    || ' -> (user_id, id)');

-- ============================================================================
-- Fixtures: two owners, each with a root category
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values
  ('11111111-1111-1111-1111-111111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'owner-a@local', '', now(), now(), now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'owner-b@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into categories (id, user_id, slug, title, parent_category_id) values
  ('a0000000-0000-0000-0000-0000000000a1'::uuid,
   '11111111-1111-1111-1111-111111111111', 'a-root', 'A Root', NULL),
  ('b0000000-0000-0000-0000-0000000000b1'::uuid,
   '22222222-2222-2222-2222-222222222222', 'b-root', 'B Root', NULL);

-- ============================================================================
-- Same-owner nesting and roots are still allowed
-- ============================================================================

select lives_ok(
  $$ insert into categories (id, user_id, slug, title, parent_category_id)
     values ('a0000000-0000-0000-0000-0000000000a2'::uuid,
             '11111111-1111-1111-1111-111111111111', 'a-child', 'A Child',
             'a0000000-0000-0000-0000-0000000000a1'::uuid) $$,
  'a child may nest under a same-owner parent');

select lives_ok(
  $$ insert into categories (id, user_id, slug, title, parent_category_id)
     values ('a0000000-0000-0000-0000-0000000000a3'::uuid,
             '11111111-1111-1111-1111-111111111111', 'a-root2', 'A Root 2',
             NULL) $$,
  'a root category (NULL parent) is still allowed');

-- ============================================================================
-- Cross-owner nesting is rejected by the composite FK (23503) — on both INSERT
-- of a new child and UPDATE re-pointing an existing one at another owner.
-- ============================================================================

select throws_ok(
  $$ insert into categories (id, user_id, slug, title, parent_category_id)
     values ('a0000000-0000-0000-0000-0000000000a4'::uuid,
             '11111111-1111-1111-1111-111111111111', 'a-cross', 'A Cross',
             'b0000000-0000-0000-0000-0000000000b1'::uuid) $$,
  '23503',
  NULL,
  'inserting a child under another owner''s category is rejected');

select throws_ok(
  $$ update categories
     set parent_category_id = 'b0000000-0000-0000-0000-0000000000b1'::uuid
     where id = 'a0000000-0000-0000-0000-0000000000a2'::uuid $$,
  '23503',
  NULL,
  're-pointing an existing child at another owner''s category is rejected');

select * from finish();
rollback;

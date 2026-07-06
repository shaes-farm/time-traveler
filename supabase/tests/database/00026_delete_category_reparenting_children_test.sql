-- pgTAP tests for 00026_delete_category_reparenting_children.sql (issue #59 —
-- atomic reparent-then-delete for the category taxonomy).
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

-- ============================================================================
-- Function signature and security mode
-- ============================================================================

select has_function('public', 'delete_category_reparenting_children',
  array['uuid'],
  'delete_category_reparenting_children function exists');

select is(
  (select prosecdef from pg_proc
    where proname='delete_category_reparenting_children'
      and pronamespace='public'::regnamespace),
  false,
  'delete_category_reparenting_children is SECURITY INVOKER (RLS applies)'
);

-- ============================================================================
-- Fixtures: two owners so RLS isolation can be exercised
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

-- Owner A's tree: gp → node → child, plus a root → rootChild pair.
insert into categories (id, user_id, slug, title, parent_category_id) values
  ('a0000000-0000-0000-0000-0000000000a1'::uuid,
   '11111111-1111-1111-1111-111111111111', 'gp', 'Grandparent', NULL),
  ('a0000000-0000-0000-0000-0000000000a2'::uuid,
   '11111111-1111-1111-1111-111111111111', 'node', 'Node',
   'a0000000-0000-0000-0000-0000000000a1'::uuid),
  ('a0000000-0000-0000-0000-0000000000a3'::uuid,
   '11111111-1111-1111-1111-111111111111', 'child', 'Child',
   'a0000000-0000-0000-0000-0000000000a2'::uuid),
  ('a0000000-0000-0000-0000-0000000000a4'::uuid,
   '11111111-1111-1111-1111-111111111111', 'root', 'Root', NULL),
  ('a0000000-0000-0000-0000-0000000000a5'::uuid,
   '11111111-1111-1111-1111-111111111111', 'rootchild', 'Root Child',
   'a0000000-0000-0000-0000-0000000000a4'::uuid);

-- Owner B's category (invisible to A under RLS).
insert into categories (id, user_id, slug, title, parent_category_id) values
  ('b0000000-0000-0000-0000-0000000000b1'::uuid,
   '22222222-2222-2222-2222-222222222222', 'b-cat', 'B Category', NULL);

-- ============================================================================
-- Reparent-then-delete as owner A: node is removed, its child moves up to gp
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$ select public.delete_category_reparenting_children(
       'a0000000-0000-0000-0000-0000000000a2'::uuid) $$,
  'owner can reparent-then-delete their own category'
);

select is(
  (select count(*)::int from categories
    where id = 'a0000000-0000-0000-0000-0000000000a2'::uuid),
  0,
  'the target node is deleted'
);

select is(
  (select parent_category_id from categories
    where id = 'a0000000-0000-0000-0000-0000000000a3'::uuid),
  'a0000000-0000-0000-0000-0000000000a1'::uuid,
  'the child is reparented to the grandparent, not cascade-deleted'
);

-- Deleting a root node moves its children to root (NULL parent).
select public.delete_category_reparenting_children(
  'a0000000-0000-0000-0000-0000000000a4'::uuid);

select is(
  (select parent_category_id from categories
    where id = 'a0000000-0000-0000-0000-0000000000a5'::uuid),
  NULL::uuid,
  'a root node''s children are reparented to root (NULL)'
);

-- ============================================================================
-- RLS isolation: A cannot delete B's category — it is invisible, so the
-- function raises "not found" (SQLSTATE P0002) and B's row is untouched.
-- ============================================================================

select throws_ok(
  $$ select public.delete_category_reparenting_children(
       'b0000000-0000-0000-0000-0000000000b1'::uuid) $$,
  'P0002',
  NULL,
  'deleting another owner''s category raises not-found (RLS hides it)'
);

reset role; reset request.jwt.claims;

select is(
  (select count(*)::int from categories
    where id = 'b0000000-0000-0000-0000-0000000000b1'::uuid),
  1,
  'the other owner''s category is left untouched'
);

select * from finish();
rollback;

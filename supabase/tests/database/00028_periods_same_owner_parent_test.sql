-- pgTAP tests for 00028_periods_same_owner_parent.sql (issue #60 — period
-- nesting is constrained to a single owner via a composite FK; parent-delete
-- cascades to descendants but leaves associated events/timelines untouched).
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

-- ============================================================================
-- Constraint shape
-- ============================================================================

select col_is_unique('periods', array['user_id', 'id'],
  'periods has a UNIQUE (user_id, id) key for the composite FK to target');

select fk_ok(
  'public', 'periods', array['user_id', 'parent_period_id'],
  'public', 'periods', array['user_id', 'id'],
  'parent link is an owner-scoped composite FK (user_id, parent_period_id)'
    || ' -> (user_id, id)');

-- ============================================================================
-- Fixtures: two owners, each with a root period
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

insert into periods (id, user_id, slug, title, temporal_data, parent_period_id)
  values
  ('a0000000-0000-0000-0000-0000000000a1'::uuid,
   '11111111-1111-1111-1111-111111111111', 'a-root', 'A Root',
   '{"era":"CE","year":1000}'::jsonb, NULL),
  ('b0000000-0000-0000-0000-0000000000b1'::uuid,
   '22222222-2222-2222-2222-222222222222', 'b-root', 'B Root',
   '{"era":"CE","year":1000}'::jsonb, NULL);

-- ============================================================================
-- Same-owner nesting and roots are still allowed
-- ============================================================================

select lives_ok(
  $$ insert into periods (id, user_id, slug, title, temporal_data,
                          parent_period_id)
     values ('a0000000-0000-0000-0000-0000000000a2'::uuid,
             '11111111-1111-1111-1111-111111111111', 'a-child', 'A Child',
             '{"era":"CE","year":1100}'::jsonb,
             'a0000000-0000-0000-0000-0000000000a1'::uuid) $$,
  'a child may nest under a same-owner parent');

select lives_ok(
  $$ insert into periods (id, user_id, slug, title, temporal_data,
                          parent_period_id)
     values ('a0000000-0000-0000-0000-0000000000a3'::uuid,
             '11111111-1111-1111-1111-111111111111', 'a-root2', 'A Root 2',
             '{"era":"CE","year":1200}'::jsonb, NULL) $$,
  'a root period (NULL parent) is still allowed');

-- ============================================================================
-- Cross-owner nesting is rejected by the composite FK (23503) — on both INSERT
-- of a new child and UPDATE re-pointing an existing one at another owner.
-- ============================================================================

select throws_ok(
  $$ insert into periods (id, user_id, slug, title, temporal_data,
                          parent_period_id)
     values ('a0000000-0000-0000-0000-0000000000a4'::uuid,
             '11111111-1111-1111-1111-111111111111', 'a-cross', 'A Cross',
             '{"era":"CE","year":1300}'::jsonb,
             'b0000000-0000-0000-0000-0000000000b1'::uuid) $$,
  '23503',
  NULL,
  'inserting a child under another owner''s period is rejected');

select throws_ok(
  $$ update periods
     set parent_period_id = 'b0000000-0000-0000-0000-0000000000b1'::uuid
     where id = 'a0000000-0000-0000-0000-0000000000a2'::uuid $$,
  '23503',
  NULL,
  're-pointing an existing child at another owner''s period is rejected');

-- ============================================================================
-- Deleting a parent cascades to descendant periods, but leaves associated
-- events and timelines untouched (span-overlay model: no period_events junction,
-- and period_timelines is the only association).
-- ============================================================================

insert into timelines (id, user_id, slug, title) values
  ('c0000000-0000-0000-0000-0000000000c1'::uuid,
   '11111111-1111-1111-1111-111111111111', 'a-tl', 'A Timeline');

insert into events (id, user_id, slug, title, temporal_data) values
  ('e0000000-0000-0000-0000-0000000000e1'::uuid,
   '11111111-1111-1111-1111-111111111111', 'a-ev', 'A Event',
   '{"era":"CE","year":1050}'::jsonb);

insert into period_timelines (period_id, timeline_id) values
  ('a0000000-0000-0000-0000-0000000000a1'::uuid,
   'c0000000-0000-0000-0000-0000000000c1'::uuid);

-- Deleting the root removes it and its child (a2) via ON DELETE CASCADE.
delete from periods where id = 'a0000000-0000-0000-0000-0000000000a1'::uuid;

select is_empty(
  $$ select 1 from periods
     where id = 'a0000000-0000-0000-0000-0000000000a2'::uuid $$,
  'deleting a parent period cascades to its descendant periods');

select isnt_empty(
  $$ select 1 from timelines
     where id = 'c0000000-0000-0000-0000-0000000000c1'::uuid $$,
  'a timeline overlaid by a deleted period survives (period_timelines cascade '
    || 'only removes the junction row)');

select isnt_empty(
  $$ select 1 from events
     where id = 'e0000000-0000-0000-0000-0000000000e1'::uuid $$,
  'an event in a deleted period''s span survives (no period_events FK)');

select * from finish();
rollback;

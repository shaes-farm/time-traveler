-- pgTAP tests for 00008_database_functions.sql (issue #20 — read-only RPC functions)
begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- ============================================================================
-- Function signatures + volatility + security mode
-- ============================================================================

select has_function('public', 'events_in_temporal_range',
  array['bigint', 'bigint', 'uuid'],
  'events_in_temporal_range function exists');
select volatility_is('public', 'events_in_temporal_range',
  array['bigint', 'bigint', 'uuid'], 'stable',
  'events_in_temporal_range is STABLE');

select has_function('public', 'character_network',
  array['uuid', 'integer'],
  'character_network function exists');
select volatility_is('public', 'character_network',
  array['uuid', 'integer'], 'stable',
  'character_network is STABLE');

select has_function('public', 'events_shared_by_characters',
  array['uuid[]'],
  'events_shared_by_characters function exists');
select volatility_is('public', 'events_shared_by_characters',
  array['uuid[]'], 'stable',
  'events_shared_by_characters is STABLE');

select has_function('public', 'get_user_metrics',
  array['uuid'],
  'get_user_metrics function exists');
select volatility_is('public', 'get_user_metrics',
  array['uuid'], 'stable',
  'get_user_metrics is STABLE');
select is(
  (select prosecdef from pg_proc
    where proname='get_user_metrics' and pronamespace='public'::regnamespace),
  true,
  'get_user_metrics is SECURITY DEFINER'
);

-- ============================================================================
-- Fixture data
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('cccccccc-0000-0000-0000-cccccccccccc'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'rpc@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into timelines (id, user_id, slug, title, temporal_data) values
  ('cccccccc-0001-0000-0000-cccccccccccc'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'tl-main', 'Main TL', '{"year":1000,"era":"CE"}'::jsonb),
  ('cccccccc-0001-0000-0000-dddddddddddd'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'tl-side', 'Side TL', '{"year":1000,"era":"CE"}'::jsonb);

-- 5 events at years 100, 500, 1000, 1500, 2000 on the main timeline,
-- plus one event at year 1200 on the side timeline (to test timeline filter)
insert into events (id, user_id, slug, title, temporal_data, timeline_id) values
  ('cccccccc-0002-0000-0000-000000000100'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'ev-100', 'Year 100', '{"year":100,"era":"CE"}'::jsonb,
   'cccccccc-0001-0000-0000-cccccccccccc'),
  ('cccccccc-0002-0000-0000-000000000500'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'ev-500', 'Year 500', '{"year":500,"era":"CE"}'::jsonb,
   'cccccccc-0001-0000-0000-cccccccccccc'),
  ('cccccccc-0002-0000-0000-000000001000'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'ev-1000', 'Year 1000', '{"year":1000,"era":"CE"}'::jsonb,
   'cccccccc-0001-0000-0000-cccccccccccc'),
  ('cccccccc-0002-0000-0000-000000001500'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'ev-1500', 'Year 1500', '{"year":1500,"era":"CE"}'::jsonb,
   'cccccccc-0001-0000-0000-cccccccccccc'),
  ('cccccccc-0002-0000-0000-000000002000'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'ev-2000', 'Year 2000', '{"year":2000,"era":"CE"}'::jsonb,
   'cccccccc-0001-0000-0000-cccccccccccc'),
  ('cccccccc-0002-0000-0000-000000001200'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc',
   'ev-side-1200', 'Side Year 1200', '{"year":1200,"era":"CE"}'::jsonb,
   'cccccccc-0001-0000-0000-dddddddddddd');

-- Characters: Hero, Rival, Ally
insert into characters (id, user_id, slug, name, character_type) values
  ('cccccccc-0004-0000-0000-000000000001'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc', 'hero', 'Hero', 'human'),
  ('cccccccc-0004-0000-0000-000000000002'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc', 'rival', 'Rival', 'human'),
  ('cccccccc-0004-0000-0000-000000000003'::uuid,
   'cccccccc-0000-0000-0000-cccccccccccc', 'ally', 'Ally', 'human');

-- Vocabulary fixture: 00029 replaced the relationship_type CHECK with an FK to
-- relationship_types, which 00029 leaves empty (content ships in 00030).
insert into relationship_categories (key, label) values ('social', 'Social')
  on conflict (key) do nothing;
insert into relationship_types (key, label, category_key) values
  ('rivalry', 'Rivalry', 'social'),
  ('friendship', 'Friendship', 'social')
  on conflict (key) do nothing;

-- Chain: Hero -> Rival, Rival -> Ally (for character_network depth tests)
insert into character_relationships (user_id, character_id, related_character_id, relationship_type)
values
  ('cccccccc-0000-0000-0000-cccccccccccc',
   'cccccccc-0004-0000-0000-000000000001',
   'cccccccc-0004-0000-0000-000000000002', 'rivalry'),
  ('cccccccc-0000-0000-0000-cccccccccccc',
   'cccccccc-0004-0000-0000-000000000002',
   'cccccccc-0004-0000-0000-000000000003', 'friendship');

-- Event participation:
--   ev-500 has Hero + Rival
--   ev-1000 has Hero only
--   ev-1500 has Hero + Rival + Ally
insert into event_characters (event_id, character_id, role, significance) values
  ('cccccccc-0002-0000-0000-000000000500',
   'cccccccc-0004-0000-0000-000000000001', 'protagonist', 'primary'),
  ('cccccccc-0002-0000-0000-000000000500',
   'cccccccc-0004-0000-0000-000000000002', 'antagonist', 'primary'),
  ('cccccccc-0002-0000-0000-000000001000',
   'cccccccc-0004-0000-0000-000000000001', 'protagonist', 'primary'),
  ('cccccccc-0002-0000-0000-000000001500',
   'cccccccc-0004-0000-0000-000000000001', 'protagonist', 'primary'),
  ('cccccccc-0002-0000-0000-000000001500',
   'cccccccc-0004-0000-0000-000000000002', 'antagonist', 'secondary'),
  ('cccccccc-0002-0000-0000-000000001500',
   'cccccccc-0004-0000-0000-000000000003', 'witness', 'secondary');

-- ============================================================================
-- events_in_temporal_range
-- ============================================================================

select is(
  (select count(*) from public.events_in_temporal_range(500::bigint, 1500::bigint)),
  4::bigint, 'events_in_temporal_range with no timeline filter returns all 4 events in range (main + side)'
);

select is(
  (select count(*) from public.events_in_temporal_range(0::bigint, 50::bigint)),
  0::bigint, 'events_in_temporal_range returns 0 for an empty range'
);

select is(
  (select count(*) from public.events_in_temporal_range(
    500::bigint, 1500::bigint, 'cccccccc-0001-0000-0000-cccccccccccc'::uuid)),
  3::bigint, 'events_in_temporal_range with timeline filter excludes side-timeline event'
);

select is(
  (select array_agg(title order by sort_order_years)
     from public.events_in_temporal_range(500::bigint, 1500::bigint,
       'cccccccc-0001-0000-0000-cccccccccccc'::uuid)),
  array['Year 500'::varchar, 'Year 1000'::varchar, 'Year 1500'::varchar],
  'events_in_temporal_range returns results sorted ascending by year'
);

-- ============================================================================
-- character_network
-- ============================================================================

select is(
  (select count(*) from public.character_network(
    'cccccccc-0004-0000-0000-000000000001'::uuid, 1)),
  1::bigint, 'character_network with depth=1 returns 1 row (Hero -> Rival)'
);

select is(
  (select count(*) from public.character_network(
    'cccccccc-0004-0000-0000-000000000001'::uuid, 2)),
  2::bigint, 'character_network with depth=2 returns 2 rows (adds Rival -> Ally)'
);

select is(
  (select max(depth) from public.character_network(
    'cccccccc-0004-0000-0000-000000000001'::uuid, 2)),
  2, 'character_network respects depth bound'
);

select is(
  (select target_name from public.character_network(
    'cccccccc-0004-0000-0000-000000000001'::uuid, 2)
    where depth = 2),
  'Ally', 'character_network surfaces the depth-2 target name'
);

-- ============================================================================
-- events_shared_by_characters
-- ============================================================================

-- Hero + Rival together: ev-500 and ev-1500
select is(
  (select count(*) from public.events_shared_by_characters(
    array['cccccccc-0004-0000-0000-000000000001'::uuid,
          'cccccccc-0004-0000-0000-000000000002'::uuid])),
  2::bigint, 'events_shared_by_characters(Hero, Rival) returns 2 shared events'
);

-- Hero + Rival + Ally together: only ev-1500
select is(
  (select count(*) from public.events_shared_by_characters(
    array['cccccccc-0004-0000-0000-000000000001'::uuid,
          'cccccccc-0004-0000-0000-000000000002'::uuid,
          'cccccccc-0004-0000-0000-000000000003'::uuid])),
  1::bigint, 'events_shared_by_characters(Hero, Rival, Ally) returns 1 shared event'
);

select is(
  (select title from public.events_shared_by_characters(
    array['cccccccc-0004-0000-0000-000000000001'::uuid,
          'cccccccc-0004-0000-0000-000000000002'::uuid,
          'cccccccc-0004-0000-0000-000000000003'::uuid])),
  'Year 1500'::varchar, 'events_shared_by_characters surfaces the right event title'
);

-- Single character: all events with that character
select is(
  (select count(*) from public.events_shared_by_characters(
    array['cccccccc-0004-0000-0000-000000000001'::uuid])),
  3::bigint, 'events_shared_by_characters(Hero) returns all 3 events with Hero'
);

-- ============================================================================
-- get_user_metrics
-- ============================================================================

select is(
  (select count(*) from public.get_user_metrics(
    'cccccccc-0000-0000-0000-cccccccccccc'::uuid)),
  7::bigint, 'get_user_metrics returns one row per entity type (7 total)'
);

select is(
  (select count from public.get_user_metrics(
    'cccccccc-0000-0000-0000-cccccccccccc'::uuid)
    where entity_type = 'events'),
  6::bigint, 'get_user_metrics counts owner''s 6 events correctly'
);

select is(
  (select count from public.get_user_metrics(
    'cccccccc-0000-0000-0000-cccccccccccc'::uuid)
    where entity_type = 'timelines'),
  2::bigint, 'get_user_metrics counts owner''s 2 timelines correctly'
);

select is(
  (select count from public.get_user_metrics(
    'cccccccc-0000-0000-0000-cccccccccccc'::uuid)
    where entity_type = 'characters'),
  3::bigint, 'get_user_metrics counts owner''s 3 characters correctly'
);

-- Nonexistent user → all zeros
select is(
  (select sum(count)::bigint from public.get_user_metrics(
    '00000000-0000-0000-0000-000000000000'::uuid)),
  0::bigint, 'get_user_metrics returns all zeros for an unknown user_id'
);

-- ============================================================================
-- SECURITY DEFINER bypasses RLS — anon can call get_user_metrics
-- and still see accurate counts even though anon would otherwise be filtered.
-- ============================================================================

set local role anon;
select is(
  (select count from public.get_user_metrics(
    'cccccccc-0000-0000-0000-cccccccccccc'::uuid)
    where entity_type = 'events'),
  6::bigint, 'anon can call get_user_metrics and SECURITY DEFINER bypasses RLS for accurate counts'
);

reset role;
select * from finish();
rollback;

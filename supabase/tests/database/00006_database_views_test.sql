-- pgTAP tests for 00006_database_views.sql (issue #18 — database views)
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

-- ============================================================================
-- Views and key columns exist
-- ============================================================================
select has_view('public', 'character_timeline_view', 'character_timeline_view exists');
select has_view('public', 'character_network_view', 'character_network_view exists');
select has_view('public', 'event_participants_view', 'event_participants_view exists');

select ok(
  (select reloptions from pg_class where relname = 'character_timeline_view')
    @> array['security_invoker=true'],
  'character_timeline_view has security_invoker = true'
);
select ok(
  (select reloptions from pg_class where relname = 'character_network_view')
    @> array['security_invoker=true'],
  'character_network_view has security_invoker = true'
);
select ok(
  (select reloptions from pg_class where relname = 'event_participants_view')
    @> array['security_invoker=true'],
  'event_participants_view has security_invoker = true'
);

select has_column('public', 'character_timeline_view', 'character_id', 'character_timeline_view.character_id exists');
select has_column('public', 'character_timeline_view', 'event_id', 'character_timeline_view.event_id exists');
select has_column('public', 'character_timeline_view', 'timeline_title', 'character_timeline_view.timeline_title exists');

select has_column('public', 'character_network_view', 'relationship_id', 'character_network_view.relationship_id exists');
select has_column('public', 'character_network_view', 'related_name', 'character_network_view.related_name exists');

select has_column('public', 'event_participants_view', 'participant_count', 'event_participants_view.participant_count exists');
select has_column('public', 'event_participants_view', 'participants', 'event_participants_view.participants exists');

-- ============================================================================
-- Fixture data for join validation
-- ============================================================================
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('abababab-abab-abab-abab-abababababab'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'views@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into characters (user_id, slug, name, character_type) values
  ('abababab-abab-abab-abab-abababababab', 'hero', 'Hero', 'human'),
  ('abababab-abab-abab-abab-abababababab', 'rival', 'Rival', 'human'),
  ('abababab-abab-abab-abab-abababababab', 'ally', 'Ally', 'human');

insert into timelines (user_id, slug, title, temporal_data)
  values (
    'abababab-abab-abab-abab-abababababab',
    'main-timeline',
    'Main Timeline',
    '{"year": 900, "era": "CE"}'::jsonb
  );

insert into events (user_id, slug, title, temporal_data, timeline_id) values
  (
    'abababab-abab-abab-abab-abababababab',
    'early-event',
    'Early Event',
    '{"year": 1000, "era": "CE"}'::jsonb,
    (select id from timelines where slug='main-timeline')
  ),
  (
    'abababab-abab-abab-abab-abababababab',
    'battle-event',
    'Battle Event',
    '{"year": 1200, "era": "CE"}'::jsonb,
    (select id from timelines where slug='main-timeline')
  ),
  (
    'abababab-abab-abab-abab-abababababab',
    'quiet-event',
    'Quiet Event',
    '{"year": 1300, "era": "CE"}'::jsonb,
    (select id from timelines where slug='main-timeline')
  );

insert into event_characters (event_id, character_id, role, significance) values
  (
    (select id from events where slug='early-event'),
    (select id from characters where slug='hero'),
    'witness',
    'secondary'
  ),
  (
    (select id from events where slug='battle-event'),
    (select id from characters where slug='hero'),
    'protagonist',
    'primary'
  ),
  (
    (select id from events where slug='battle-event'),
    (select id from characters where slug='rival'),
    'antagonist',
    'secondary'
  );

insert into character_relationships (
  user_id, character_id, related_character_id, relationship_type, description,
  start_temporal, end_temporal
)
values (
  'abababab-abab-abab-abab-abababababab',
  (select id from characters where slug='hero'),
  (select id from characters where slug='rival'),
  'rivalry',
  'Long-standing rivalry',
  '{"year": 1190, "era": "CE"}'::jsonb,
  '{"year": 1210, "era": "CE"}'::jsonb
);

-- ============================================================================
-- character_timeline_view join + ordering behavior
-- ============================================================================
select is(
  (select count(*) from character_timeline_view where character_name='Hero'),
  2::bigint,
  'character_timeline_view returns 2 rows for Hero'
);

select is(
  (select event_title from character_timeline_view
    where character_name='Hero'
    order by sort_order_years
    limit 1),
  'Early Event',
  'character_timeline_view exposes event temporal ordering'
);

select is(
  (select role from character_timeline_view
    where character_name='Hero' and event_title='Battle Event'),
  'protagonist'::varchar,
  'character_timeline_view includes participation role'
);

select is(
  (select timeline_title from character_timeline_view
    where character_name='Hero' and event_title='Battle Event'),
  'Main Timeline'::varchar,
  'character_timeline_view includes timeline title'
);

-- ============================================================================
-- character_network_view join behavior
-- ============================================================================
select is(
  (select related_name from character_network_view where character_name='Hero'),
  'Rival'::varchar,
  'character_network_view joins related character name'
);

select is(
  (select relationship_type from character_network_view where character_name='Hero'),
  'rivalry'::varchar,
  'character_network_view includes relationship type'
);

select ok(
  (
    select start_temporal from character_network_view where character_name='Hero'
  ) = '{"year": 1190, "era": "CE"}'::jsonb,
  'character_network_view includes start_temporal scope'
);

select ok(
  (
    select end_temporal from character_network_view where character_name='Hero'
  ) = '{"year": 1210, "era": "CE"}'::jsonb,
  'character_network_view includes end_temporal scope'
);

-- ============================================================================
-- event_participants_view aggregation behavior
-- ============================================================================
select is(
  (select participant_count from event_participants_view where title='Battle Event'),
  2::bigint,
  'event_participants_view counts participants'
);

select ok(
  (
    select participants::jsonb from event_participants_view where title='Battle Event'
  ) @> '[{"name":"Hero","type":"human","role":"protagonist","significance":"primary"}]'::jsonb,
  'event_participants_view includes Hero participant details'
);

select ok(
  (
    select participants::jsonb from event_participants_view where title='Battle Event'
  ) @> '[{"name":"Rival","type":"human","role":"antagonist","significance":"secondary"}]'::jsonb,
  'event_participants_view includes Rival participant details'
);

select is(
  (select participant_count from event_participants_view where title='Quiet Event'),
  0::bigint,
  'event_participants_view reports zero participants for events without event_characters rows'
);

select is(
  (select participants from event_participants_view where title='Quiet Event'),
  '[]'::json,
  'event_participants_view returns empty JSON array for events without participants'
);

-- ============================================================================
-- Read-only view behavior (no INSTEAD OF triggers required)
-- ============================================================================
select is(
  (select is_updatable from information_schema.views
    where table_schema='public' and table_name='character_timeline_view'),
  'NO',
  'character_timeline_view is read-only'
);

select is(
  (select is_updatable from information_schema.views
    where table_schema='public' and table_name='character_network_view'),
  'NO',
  'character_network_view is read-only'
);

select is(
  (select is_updatable from information_schema.views
    where table_schema='public' and table_name='event_participants_view'),
  'NO',
  'event_participants_view is read-only'
);

select * from finish();
rollback;

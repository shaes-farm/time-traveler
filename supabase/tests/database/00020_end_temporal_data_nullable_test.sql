-- pgTAP tests for 00020_end_temporal_data_nullable.sql (issue #215)
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

-- ============================================================================
-- end_temporal_data defaults are removed (NULL-by-default)
-- ============================================================================

select ok(
  not exists (
    select 1
    from pg_attrdef d
    join pg_class c on c.oid = d.adrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = d.adnum
    where n.nspname = 'public'
      and c.relname = 'timelines'
      and a.attname = 'end_temporal_data'
  ),
  'timelines.end_temporal_data has no default'
);

select ok(
  not exists (
    select 1
    from pg_attrdef d
    join pg_class c on c.oid = d.adrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = d.adnum
    where n.nspname = 'public'
      and c.relname = 'events'
      and a.attname = 'end_temporal_data'
  ),
  'events.end_temporal_data has no default'
);

select ok(
  not exists (
    select 1
    from pg_attrdef d
    join pg_class c on c.oid = d.adrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = d.adnum
    where n.nspname = 'public'
      and c.relname = 'periods'
      and a.attname = 'end_temporal_data'
  ),
  'periods.end_temporal_data has no default'
);

-- ============================================================================
-- Inserts without end_temporal_data persist NULL for all three entities
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'end-null@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into timelines (user_id, slug, title, temporal_data)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'tl-end-null', 'Timeline End Null',
          '{"year":2000,"era":"CE","precision":"exact"}'::jsonb);

insert into events (user_id, slug, title, temporal_data)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ev-end-null', 'Event End Null',
          '{"year":2001,"era":"CE","precision":"exact"}'::jsonb);

insert into periods (user_id, slug, title, temporal_data)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'pd-end-null', 'Period End Null',
          '{"year":2002,"era":"CE","precision":"exact"}'::jsonb);

select is(
  (select end_temporal_data from timelines where slug = 'tl-end-null'),
  null::jsonb,
  'timeline insert without end_temporal_data stores NULL'
);

select is(
  (select end_temporal_data from events where slug = 'ev-end-null'),
  null::jsonb,
  'event insert without end_temporal_data stores NULL'
);

select is(
  (select end_temporal_data from periods where slug = 'pd-end-null'),
  null::jsonb,
  'period insert without end_temporal_data stores NULL'
);

-- ============================================================================
-- Clearing end_temporal_data to NULL remains valid
-- ============================================================================

update timelines
set end_temporal_data = '{"year":2010,"era":"CE","precision":"exact"}'::jsonb
where slug = 'tl-end-null';

update timelines
set end_temporal_data = null
where slug = 'tl-end-null';

select is(
  (select end_temporal_data from timelines where slug = 'tl-end-null'),
  null::jsonb,
  'timeline end_temporal_data can be cleared back to NULL'
);

select * from finish();
rollback;

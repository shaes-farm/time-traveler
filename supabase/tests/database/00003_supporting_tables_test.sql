-- pgTAP tests for 00003_supporting_tables.sql (issue #15 — notifications + content_reports)
begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

-- ============================================================================
-- Tables exist + RLS enabled
-- ============================================================================
select has_table('public', 'notifications',   'notifications table exists');
select has_table('public', 'content_reports', 'content_reports table exists');

select is(
  (select count(*) from pg_tables
    where schemaname='public' and tablename in ('notifications','content_reports')
      and rowsecurity),
  2::bigint,
  'both supporting tables have RLS enabled'
);

-- ============================================================================
-- Indexes exist
-- ============================================================================
select has_index('public', 'notifications',   'idx_notifications_user',
  'idx_notifications_user index exists');
select has_index('public', 'content_reports', 'idx_reports_status',
  'idx_reports_status index exists');
select has_index('public', 'content_reports', 'idx_reports_entity',
  'idx_reports_entity index exists');

-- ============================================================================
-- sync_notification_read_at trigger function exists
-- ============================================================================
select has_function('public', 'sync_notification_read_at',
  'sync_notification_read_at trigger function exists');
select has_trigger('public', 'notifications', 'set_read_at',
  'set_read_at trigger on notifications');

-- ============================================================================
-- CHECK constraints
-- ============================================================================
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'sup@local', '', now(), now(), now(), 'authenticated', 'authenticated');

select throws_ok(
  $$insert into notifications (user_id, type, title)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'fake_type', 't')$$,
  '23514', null,
  'notifications.type CHECK rejects unknown value'
);

select throws_ok(
  $$insert into content_reports (reporter_id, entity_type, entity_id, reason)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'unknown',
            '00000000-0000-0000-0000-000000000abc'::uuid, 'inappropriate')$$,
  '23514', null,
  'content_reports.entity_type CHECK rejects unknown value'
);

select throws_ok(
  $$insert into content_reports (reporter_id, entity_type, entity_id, reason)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'timeline',
            '00000000-0000-0000-0000-000000000abc'::uuid, 'bogus')$$,
  '23514', null,
  'content_reports.reason CHECK rejects unknown value'
);

select throws_ok(
  $$insert into content_reports (reporter_id, entity_type, entity_id, reason, status)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'timeline',
            '00000000-0000-0000-0000-000000000abc'::uuid, 'inappropriate', 'unknown_status')$$,
  '23514', null,
  'content_reports.status CHECK rejects unknown value'
);

-- ============================================================================
-- sync_notification_read_at trigger behavior
-- ============================================================================
insert into notifications (user_id, type, title, body)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'system_message', 'hi', 'msg');

select is(
  (select read_at from notifications
    where user_id='dddddddd-dddd-dddd-dddd-dddddddddddd' and title='hi'),
  null::timestamptz,
  'read_at is NULL before read flips true'
);

update notifications set read = true
  where user_id='dddddddd-dddd-dddd-dddd-dddddddddddd' and title='hi';
select isnt(
  (select read_at from notifications
    where user_id='dddddddd-dddd-dddd-dddd-dddddddddddd' and title='hi'),
  null::timestamptz,
  'sync_notification_read_at populates read_at when read flips true'
);

-- Updating an unrelated field shouldn't change read_at
update notifications set read_at = '2020-01-01 00:00:00+00'::timestamptz
  where user_id='dddddddd-dddd-dddd-dddd-dddddddddddd' and title='hi';
update notifications set body = 'updated msg'
  where user_id='dddddddd-dddd-dddd-dddd-dddddddddddd' and title='hi';
select is(
  (select read_at from notifications
    where user_id='dddddddd-dddd-dddd-dddd-dddddddddddd' and title='hi'),
  '2020-01-01 00:00:00+00'::timestamptz,
  'sync_notification_read_at does not touch read_at on unrelated UPDATE'
);

-- ============================================================================
-- ON DELETE behavior
-- ============================================================================
-- resolved_by SET NULL when admin user removed
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'admin@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into content_reports (reporter_id, entity_type, entity_id, reason, status, resolved_by, resolved_at)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'timeline',
          '00000000-0000-0000-0000-0000000000ff'::uuid, 'inappropriate', 'actioned',
          'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', now());

delete from auth.users where id='eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid;
select is(
  (select resolved_by from content_reports
    where reporter_id='dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::uuid,
  'ON DELETE SET NULL on content_reports.resolved_by when admin removed'
);

-- reporter_id CASCADE: deleting reporter removes the report
delete from auth.users where id='dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;
select is(
  (select count(*) from content_reports),
  0::bigint,
  'ON DELETE CASCADE on content_reports.reporter_id when reporter removed'
);

-- notifications.user_id CASCADE (verified by the count above implicitly — the user is gone)
select is(
  (select count(*) from notifications),
  0::bigint,
  'ON DELETE CASCADE on notifications.user_id when owner removed'
);

select * from finish();
rollback;

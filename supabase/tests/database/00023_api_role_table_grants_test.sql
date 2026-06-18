-- pgTAP tests for 00023_api_role_table_grants.sql — table-level GRANTs to the
-- PostgREST API roles (anon read-only, authenticated full DML, service_role
-- all). RLS still gates which rows each role sees; these assertions only cover
-- the base SQL privileges that RLS layers on top of.
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

-- ============================================================================
-- authenticated → SELECT, INSERT, UPDATE, DELETE on app tables
-- ============================================================================
select ok(
  has_table_privilege('authenticated', 'public.events', 'SELECT'),
  'authenticated can SELECT events');
select ok(
  has_table_privilege('authenticated', 'public.events', 'INSERT'),
  'authenticated can INSERT events');
select ok(
  has_table_privilege('authenticated', 'public.events', 'UPDATE'),
  'authenticated can UPDATE events');
select ok(
  has_table_privilege('authenticated', 'public.events', 'DELETE'),
  'authenticated can DELETE events');

-- Junction tables are covered by the schema-wide grant too.
select ok(
  has_table_privilege('authenticated', 'public.event_media', 'INSERT'),
  'authenticated can INSERT event_media (junction)');

-- ============================================================================
-- anon → SELECT only (public reader is anonymous, read-only)
-- ============================================================================
select ok(
  has_table_privilege('anon', 'public.stories', 'SELECT'),
  'anon can SELECT stories');
select ok(
  has_table_privilege('anon', 'public.events', 'SELECT'),
  'anon can SELECT events');
select ok(
  not has_table_privilege('anon', 'public.events', 'INSERT'),
  'anon CANNOT INSERT events');
select ok(
  not has_table_privilege('anon', 'public.events', 'UPDATE'),
  'anon CANNOT UPDATE events');
select ok(
  not has_table_privilege('anon', 'public.events', 'DELETE'),
  'anon CANNOT DELETE events');

-- ============================================================================
-- service_role → full DML (bypasses RLS by design; server-only key)
-- ============================================================================
select ok(
  has_table_privilege('service_role', 'public.events', 'SELECT'),
  'service_role can SELECT events');
select ok(
  has_table_privilege('service_role', 'public.events', 'INSERT'),
  'service_role can INSERT events');
select ok(
  has_table_privilege('service_role', 'public.events', 'DELETE'),
  'service_role can DELETE events');

select * from finish();
rollback;

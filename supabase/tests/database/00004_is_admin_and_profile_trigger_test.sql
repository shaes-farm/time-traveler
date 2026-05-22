-- pgTAP tests for 00004_is_admin_and_profile_trigger.sql (issue #16 — auth helpers)
begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

-- ============================================================================
-- Functions and trigger exist with the right shape
-- ============================================================================
select has_function('public', 'is_admin', 'is_admin function exists');
select volatility_is('public', 'is_admin', array[]::text[], 'stable',
  'is_admin is STABLE');
select is(
  (select prosecdef from pg_proc
    where proname='is_admin' and pronamespace='public'::regnamespace),
  true,
  'is_admin is SECURITY DEFINER'
);

select has_function('public', 'handle_new_user', 'handle_new_user function exists');
select is(
  (select prosecdef from pg_proc
    where proname='handle_new_user' and pronamespace='public'::regnamespace),
  true,
  'handle_new_user is SECURITY DEFINER'
);

select has_trigger('auth', 'users', 'on_auth_user_created',
  'on_auth_user_created trigger on auth.users');

-- ============================================================================
-- Trigger fires on auth.users INSERT, default role = editor
-- ============================================================================
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role,
                        raw_user_meta_data)
  values ('f1111111-1111-1111-1111-111111111111'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'alice.smith@local', '', now(), now(), now(), 'authenticated', 'authenticated',
          '{"first_name":"Alice","last_name":"Smith"}'::jsonb);

select is(
  (select role from profiles where id='f1111111-1111-1111-1111-111111111111'::uuid),
  'editor'::varchar,
  'auto-created profile defaults to role=editor'
);

-- Case A: full metadata
select is(
  (select first_name || '/' || last_name from profiles
    where id='f1111111-1111-1111-1111-111111111111'::uuid),
  'Alice/Smith',
  'name extraction: metadata first_name/last_name takes precedence'
);

-- Case B: no metadata, email with dot
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('f2222222-2222-2222-2222-222222222222'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'bob.jones@local', '', now(), now(), now(), 'authenticated', 'authenticated');
select is(
  (select first_name || '/' || last_name from profiles
    where id='f2222222-2222-2222-2222-222222222222'::uuid),
  'bob/jones',
  'name extraction: email local-part split on "."'
);

-- Case C: no metadata, email with underscore
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('f3333333-3333-3333-3333-333333333333'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'carol_davis@local', '', now(), now(), now(), 'authenticated', 'authenticated');
select is(
  (select first_name || '/' || last_name from profiles
    where id='f3333333-3333-3333-3333-333333333333'::uuid),
  'carol/davis',
  'name extraction: email local-part split on "_"'
);

-- Case D: no metadata, plain email
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('f4444444-4444-4444-4444-444444444444'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'charlie@local', '', now(), now(), now(), 'authenticated', 'authenticated');
select is(
  (select first_name || '/' || last_name from profiles
    where id='f4444444-4444-4444-4444-444444444444'::uuid),
  'charlie/User',
  'name extraction: plain email local-part as first_name, "User" placeholder for last_name'
);

-- Case E: single-char local-part triggers padding
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('f5555555-5555-5555-5555-555555555555'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'x@local', '', now(), now(), now(), 'authenticated', 'authenticated');
select is(
  (select first_name || '/' || last_name from profiles
    where id='f5555555-5555-5555-5555-555555555555'::uuid),
  'x./User',
  'name extraction: single-char local-part gets padded to satisfy CHECK length > 1'
);

-- ============================================================================
-- is_admin() truth check via request.jwt.claims (set inside this transaction)
-- ============================================================================
-- Non-admin: false
set local request.jwt.claims to '{"sub":"f1111111-1111-1111-1111-111111111111"}';
select is(public.is_admin(), false,
  'is_admin() returns false for editor role');

-- Promote, then re-check
reset request.jwt.claims;
update profiles set role='admin' where id='f1111111-1111-1111-1111-111111111111'::uuid;

set local request.jwt.claims to '{"sub":"f1111111-1111-1111-1111-111111111111"}';
select is(public.is_admin(), true,
  'is_admin() returns true after profile promoted to admin');

-- Unknown user: false
reset request.jwt.claims;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000999"}';
select is(public.is_admin(), false,
  'is_admin() returns false for unknown user');

-- No JWT at all: auth.uid() is NULL → false
reset request.jwt.claims;
select is(public.is_admin(), false,
  'is_admin() returns false when auth.uid() is NULL');

-- ============================================================================
-- ON CONFLICT DO NOTHING idempotency
-- ============================================================================
-- Insert a profile manually-like (post-trigger), then re-run the trigger's
-- INSERT pattern to confirm it doesn't overwrite.
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('f6666666-6666-6666-6666-666666666666'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'idem@local', '', now(), now(), now(), 'authenticated', 'authenticated');

-- The trigger has already populated profile with 'idem'/'User'.
-- Now simulate a second invocation of the trigger's INSERT path:
insert into public.profiles (id, first_name, last_name)
  values ('f6666666-6666-6666-6666-666666666666'::uuid, 'Other', 'Name')
  on conflict (id) do nothing;

select is(
  (select first_name || '/' || last_name from profiles
    where id='f6666666-6666-6666-6666-666666666666'::uuid),
  'idem/User',
  'ON CONFLICT DO NOTHING preserves the original trigger-populated row'
);

-- ============================================================================
-- Cleanup verification (delete should cascade)
-- ============================================================================
delete from auth.users where id::text like 'f%';
select is(
  (select count(*) from profiles where id::text like 'f%'),
  0::bigint,
  'CASCADE from auth.users wipes auto-created profiles'
);

select * from finish();
rollback;

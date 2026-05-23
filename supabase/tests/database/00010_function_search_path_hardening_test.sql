begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select is(
  (select array_to_string(proconfig, ',')
   from pg_proc
   where pronamespace='public'::regnamespace
     and proname='events_in_temporal_range'
     and oidvectortypes(proargtypes)='bigint, bigint, uuid'),
  'search_path=""',
  'events_in_temporal_range has search_path hardening'
);

select is(
  (select array_to_string(proconfig, ',')
   from pg_proc
   where pronamespace='public'::regnamespace
     and proname='immutable_array_to_string'
     and oidvectortypes(proargtypes)='text[], text'),
  'search_path=""',
  'immutable_array_to_string has search_path hardening'
);

select is(
  (select array_to_string(proconfig, ',')
   from pg_proc
   where pronamespace='public'::regnamespace
     and proname='handle_updated_at'
     and oidvectortypes(proargtypes)=''),
  'search_path=""',
  'handle_updated_at has search_path hardening'
);

select is(
  (select array_to_string(proconfig, ',')
   from pg_proc
   where pronamespace='public'::regnamespace
     and proname='sync_notification_read_at'
     and oidvectortypes(proargtypes)=''),
  'search_path=""',
  'sync_notification_read_at has search_path hardening'
);

select is(
  (select array_to_string(proconfig, ',')
   from pg_proc
   where pronamespace='public'::regnamespace
     and proname='character_network'
     and oidvectortypes(proargtypes)='uuid, integer'),
  'search_path=""',
  'character_network has search_path hardening'
);

select is(
  (select array_to_string(proconfig, ',')
   from pg_proc
   where pronamespace='public'::regnamespace
     and proname='events_shared_by_characters'
     and oidvectortypes(proargtypes)='uuid[]'),
  'search_path=""',
  'events_shared_by_characters has search_path hardening'
);

select * from finish();
rollback;

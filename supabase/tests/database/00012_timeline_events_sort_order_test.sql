-- pgTAP tests for 00012_timeline_events_sort_order.sql (issue #122 — add
-- sort_order to timeline_events junction).
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

-- ============================================================================
-- Column presence + type
-- ============================================================================

select has_column(
  'public', 'timeline_events', 'sort_order',
  'timeline_events.sort_order column exists'
);

select col_type_is(
  'public', 'timeline_events', 'sort_order', 'integer',
  'timeline_events.sort_order is integer'
);

-- ============================================================================
-- Default = 0; nullable (matches the timeline_media.sort_order pattern)
-- ============================================================================

select col_default_is(
  'public', 'timeline_events', 'sort_order', '0',
  'timeline_events.sort_order defaults to 0'
);

select col_is_null(
  'public', 'timeline_events', 'sort_order',
  'timeline_events.sort_order is nullable (mirrors timeline_media)'
);

-- ============================================================================
-- Insert without sort_order receives the 0 default (round-trip behaviour)
-- ============================================================================

select lives_ok(
  $$
    do $body$
    declare
      v_user_id uuid := '00000000-0000-0000-0000-000000000000';
      v_timeline_id uuid;
      v_event_id uuid;
      v_sort_order integer;
    begin
      -- Seed a corresponding auth.users row for FK integrity.
      insert into auth.users (id, instance_id, email, encrypted_password,
                              email_confirmed_at, created_at, updated_at, aud, role)
        values (v_user_id,
                '00000000-0000-0000-0000-000000000000'::uuid,
                'timeline-events-122@local', '', now(), now(), now(),
                'authenticated', 'authenticated');

      -- Minimal setup: insert a timeline and an event owned by the synthetic user.
      insert into public.timelines (user_id, slug, title)
        values (v_user_id, 'tl-test-122', 'Timeline 00012 test')
        returning id into v_timeline_id;
      insert into public.events (user_id, slug, title)
        values (v_user_id, 'ev-test-122', 'Event 00012 test')
        returning id into v_event_id;

      insert into public.timeline_events (timeline_id, event_id)
        values (v_timeline_id, v_event_id);

      select sort_order into v_sort_order
        from public.timeline_events
        where timeline_id = v_timeline_id and event_id = v_event_id;

      if v_sort_order is distinct from 0 then
        raise exception 'expected default sort_order = 0, got %', v_sort_order;
      end if;

      -- Cleanup is handled by the outer rollback.
    end
    $body$;
  $$,
  'insert without sort_order receives the 0 default'
);

select * from finish();
rollback;

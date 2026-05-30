-- pgTAP tests for 00016_story_events_sort_order.sql (issue #183 — add
-- sort_order to story_events junction).
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

-- ============================================================================
-- Column presence + type
-- ============================================================================

select has_column(
  'public', 'story_events', 'sort_order',
  'story_events.sort_order column exists'
);

select col_type_is(
  'public', 'story_events', 'sort_order', 'integer',
  'story_events.sort_order is integer'
);

-- ============================================================================
-- Default = 0; nullable (matches the timeline_events.sort_order pattern)
-- ============================================================================

select col_default_is(
  'public', 'story_events', 'sort_order', '0',
  'story_events.sort_order defaults to 0'
);

select col_is_null(
  'public', 'story_events', 'sort_order',
  'story_events.sort_order is nullable (mirrors timeline_events)'
);

-- ============================================================================
-- Insert without sort_order receives the 0 default (round-trip behaviour)
-- ============================================================================

select lives_ok(
  $$
    do $body$
    declare
      v_user_id uuid := '00000000-0000-0000-0000-000000000183';
      v_story_id uuid;
      v_event_id uuid;
      v_sort_order integer;
    begin
      -- Seed a corresponding auth.users row for FK integrity.
      insert into auth.users (id, instance_id, email, encrypted_password,
                              email_confirmed_at, created_at, updated_at, aud, role)
        values (v_user_id,
                '00000000-0000-0000-0000-000000000000'::uuid,
                'story-events-183@local', '', now(), now(), now(),
                'authenticated', 'authenticated');

      -- Minimal setup: insert a story and an event owned by the synthetic user.
      insert into public.stories (user_id, slug, title, narrator_type)
        values (v_user_id, 'st-test-183', 'Story 00016 test', 'third_person')
        returning id into v_story_id;
      insert into public.events (user_id, slug, title)
        values (v_user_id, 'ev-test-183', 'Event 00016 test')
        returning id into v_event_id;

      insert into public.story_events (story_id, event_id)
        values (v_story_id, v_event_id);

      select sort_order into v_sort_order
        from public.story_events
        where story_id = v_story_id and event_id = v_event_id;

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

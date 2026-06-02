-- pgTAP tests for 00005_performance_indexes.sql (issue #17 — performance indexes)
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- ============================================================================
-- 18 new indexes from 00005 exist
-- ============================================================================

-- Temporal ordering and range
select has_index('public', 'events',  'idx_events_sort',          'idx_events_sort exists');
select has_index('public', 'events',  'idx_events_timeline_sort', 'idx_events_timeline_sort exists');
select has_index('public', 'events',  'idx_events_range',         'idx_events_range exists');
select has_index('public', 'periods', 'idx_periods_sort',         'idx_periods_sort exists');

-- Full-text search GIN
select has_index('public', 'events',     'idx_events_search',     'idx_events_search exists');
select has_index('public', 'timelines',  'idx_timelines_search',  'idx_timelines_search exists');
select has_index('public', 'characters', 'idx_characters_search', 'idx_characters_search exists');
select has_index('public', 'stories',    'idx_stories_search',    'idx_stories_search exists');

-- Character lookups
select has_index('public', 'characters', 'idx_characters_type',    'idx_characters_type exists');
select has_index('public', 'characters', 'idx_characters_aliases', 'idx_characters_aliases exists');

-- Junction table reverse FK
select has_index('public', 'event_characters',        'idx_event_chars_char',      'idx_event_chars_char exists');
select has_index('public', 'event_characters',        'idx_event_chars_event',     'idx_event_chars_event exists');
select has_index('public', 'character_relationships', 'idx_char_rels_char',        'idx_char_rels_char exists');
select has_index('public', 'character_relationships', 'idx_char_rels_related',     'idx_char_rels_related exists');
select has_index('public', 'timeline_events',         'idx_timeline_events_event', 'idx_timeline_events_event exists');

-- Parent self-reference
-- NB: idx_events_parent was dropped with events.parent_event_id (#180, migration
-- 00019); its drop is asserted in 00019_drop_events_parent_event_id_test.sql.
select has_index('public', 'periods',    'idx_periods_parent',    'idx_periods_parent exists');
select has_index('public', 'categories', 'idx_categories_parent', 'idx_categories_parent exists');

-- ============================================================================
-- The 5 GIN indexes use the gin access method
-- ============================================================================
select is(
  (select am.amname from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join pg_am am on am.oid = c.relam
     where c.relname = 'idx_events_search'),
  'gin', 'idx_events_search uses GIN access method'
);
select is(
  (select am.amname from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join pg_am am on am.oid = c.relam
     where c.relname = 'idx_timelines_search'),
  'gin', 'idx_timelines_search uses GIN access method'
);
select is(
  (select am.amname from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join pg_am am on am.oid = c.relam
     where c.relname = 'idx_characters_search'),
  'gin', 'idx_characters_search uses GIN access method'
);
select is(
  (select am.amname from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join pg_am am on am.oid = c.relam
     where c.relname = 'idx_stories_search'),
  'gin', 'idx_stories_search uses GIN access method'
);
select is(
  (select am.amname from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join pg_am am on am.oid = c.relam
     where c.relname = 'idx_characters_aliases'),
  'gin', 'idx_characters_aliases uses GIN access method'
);

-- ============================================================================
-- AC: slug indexes from 00001/00002 still exist (verify, don't recreate)
-- ============================================================================
select has_index('public', 'profiles',   'profiles_username_idx',   'profiles_username_idx still present');
select has_index('public', 'characters', 'characters_slug_idx',     'characters_slug_idx still present');
select has_index('public', 'timelines',  'timelines_slug_idx',      'timelines_slug_idx still present');
select has_index('public', 'periods',    'periods_slug_idx',        'periods_slug_idx still present');
select has_index('public', 'events',     'events_slug_idx',         'events_slug_idx still present');
select has_index('public', 'stories',    'stories_slug_idx',        'stories_slug_idx still present');
select has_index('public', 'categories', 'categories_slug_idx',     'categories_slug_idx still present');
select has_index('public', 'media',      'media_slug_idx',          'media_slug_idx still present');

select * from finish();
rollback;

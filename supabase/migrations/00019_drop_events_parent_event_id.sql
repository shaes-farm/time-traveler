-- ============================================================================
-- 00019_drop_events_parent_event_id.sql
--
-- Drops the deprecated events.parent_event_id column (issue #180).
--
-- Fractal nesting is now forward-only: an event expands into a sub-timeline via
-- events.detail_timeline_id (#177, migration 00017), and that sub-timeline
-- contains the finer events. The backward event-to-event parent_event_id
-- self-reference was a redundant — and weaker — second way to express nesting
-- (no constraint tied a parent and child to the same timeline) and has been
-- tombstoned in the service layer and Zod schema. No seed or production data
-- ever populated it, so this is a pure schema drop, not a data migration.
--
-- Dropping the column also drops its dependent objects:
--   - the self-referential FK events_parent_event_id_fkey (ON DELETE CASCADE)
--   - the idx_events_parent index (00005)
-- They are dropped explicitly first for clarity. The service-layer cycle guard
-- that once protected parent_event_id is superseded by the detail_timeline_id
-- cycle guard (docs/system-design.md §3.4).
-- ============================================================================

DROP INDEX IF EXISTS idx_events_parent;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_parent_event_id_fkey,
  DROP COLUMN IF EXISTS parent_event_id;

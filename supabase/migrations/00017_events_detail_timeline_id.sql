-- ============================================================================
-- 00017_events_detail_timeline_id.sql
--
-- Adds detail_timeline_id to the events table (issue #177).
--
-- This is the forward fractal "drill-down" link: the sub-timeline an event
-- expands into (e.g. the "Earth forms" event opens into an "evolution of life"
-- timeline). It is the DECOMPOSITION axis of the event<->timeline model and is
-- distinct from CONTAINMENT (events.timeline_id = primary/home timeline, the
-- RLS source; timeline_events junction = secondary "also appears in"). See the
-- canonical event<->timeline model in docs/system-design.md §3.
--
-- ON DELETE SET NULL mirrors the existing events.timeline_id FK: deleting the
-- sub-timeline detaches the drill-down rather than cascading into (deleting)
-- the parent event. Access is never derived from this column — a sub-timeline's
-- collaborators do not gain access to the parent event through the fractal link
-- (see §9). The committed event RLS, idx_events_timeline_sort, and reporting
-- views are all untouched: they key on the containing timeline_id only.
--
-- Cycle prevention (an event must not expand into a timeline that transitively
-- contains it) is enforced in the service layer, consistent with the other
-- self-referential FK cycle guards (§3.4); the database intentionally does not
-- constrain it. The partial index supports the reverse lookup "which event does
-- this timeline detail?" (timeline-detail header, #177).
-- ============================================================================

ALTER TABLE events
  ADD COLUMN detail_timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL;

CREATE INDEX idx_events_detail_timeline
  ON events (detail_timeline_id) WHERE detail_timeline_id IS NOT NULL;

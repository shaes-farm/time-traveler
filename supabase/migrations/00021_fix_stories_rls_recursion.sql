-- ============================================================================
-- 00021_fix_stories_rls_recursion.sql  (#276)
--
-- Fixes `infinite recursion detected in policy for relation "stories"`, raised
-- on ANY read of `stories` — for anon AND authenticated callers alike (so the
-- public reader's stories rail and the admin stories list both fail).
--
-- Root cause (introduced in 00007_rls_policies.sql): two mutually-recursive
-- SELECT policies —
--   * read_stories       — EXISTS (… FROM story_events JOIN events …)
--   * read_story_events  — EXISTS (… FROM stories …)
-- Each table's RLS re-triggers the other's, so Postgres aborts with a recursion
-- error. This is the SAME class of bug 00007 already fixed for the
-- timelines <-> timeline_collaborators cycle (#73) using SECURITY DEFINER
-- helpers that bypass RLS — but the stories <-> story_events cycle was missed,
-- and 00007's pgTAP suite seeds no stories, so nothing exercised it.
--
-- Fix: isolate ONLY the cyclic part — "is this story reachable by a timeline
-- collaborator through one of its events" — into a SECURITY DEFINER helper that
-- bypasses RLS on story_events/events. `read_stories` then keeps the cheap
-- published/owner/admin checks INLINE (so they still benefit from the
-- auth_rls_initplan `(select …)` optimization from 00011 and never re-query the
-- in-hand row), delegating only the collaborator branch — exactly mirroring
-- `read_timelines`. `read_story_events` only holds a `story_id`, so it uses a
-- by-id helper that composes the same predicate. Breaking the read cycle also
-- unblocks the insert_/delete_story_events write policies, whose
-- `EXISTS (… FROM stories …)` checks transitively triggered the same recursion.
-- ============================================================================

-- The ONLY part of story visibility that forms the RLS cycle: a story is
-- reachable by a collaborator on a timeline that one of the story's events
-- belongs to. SECURITY DEFINER bypasses RLS on story_events/events so it never
-- re-enters stories' RLS. STABLE / SET search_path='' / fully-qualified — same
-- hardening pattern as is_admin() / is_timeline_collaborator().
CREATE OR REPLACE FUNCTION public.story_has_collaborating_event(s_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.story_events se
    JOIN public.events e ON se.event_id = e.id
    WHERE se.story_id = s_id
      AND public.is_timeline_collaborator(e.timeline_id)
  );
$$;

-- Full story visibility by id, for callers that only hold a story_id (i.e. the
-- read_story_events policy). SECURITY DEFINER + explicit predicate so it is
-- self-contained and never re-enters RLS; reuses the collaborator helper.
CREATE OR REPLACE FUNCTION public.is_story_readable(s_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = s_id
      AND (
        s.published = true
        OR s.user_id = auth.uid()
        OR public.is_admin()
      )
  ) OR public.story_has_collaborating_event(s_id);
$$;

-- read_stories: the row is in hand, so keep published/owner/admin inline (with
-- the initplan `(select …)` optimization) and delegate ONLY the cyclic
-- collaborator-via-events branch. Mirrors read_timelines (00011).
DROP POLICY IF EXISTS "read_stories" ON public.stories;
CREATE POLICY "read_stories" ON public.stories FOR SELECT
  USING (
    published = true
    OR user_id = (select auth.uid())
    OR (select public.is_admin())
    OR public.story_has_collaborating_event(id)
  );

-- read_story_events: "visible iff the parent story is visible". Only the
-- story_id is available here, so delegate to the by-id helper (was a direct
-- EXISTS over stories — the other half of the cycle).
DROP POLICY IF EXISTS "read_story_events" ON public.story_events;
CREATE POLICY "read_story_events" ON public.story_events FOR SELECT
  USING (public.is_story_readable(story_id));

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
-- Fix: encapsulate the full story-visibility predicate in a STABLE SECURITY
-- DEFINER helper (bypasses RLS internally, exactly like is_timeline_*), and use
-- it on BOTH sides of the cycle. Visibility semantics are preserved verbatim:
-- a story is visible iff it is published, owned by the caller, the caller is an
-- admin, or the caller collaborates on a timeline that one of the story's
-- events belongs to. Breaking the read cycle also unblocks the
-- insert_/delete_story_events write policies, whose `EXISTS (… FROM stories …)`
-- checks transitively triggered the same recursion.
-- ============================================================================

-- SECURITY DEFINER helper — STABLE, SET search_path='', fully-qualified: same
-- hardening pattern as is_admin() / is_timeline_collaborator().
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
        OR EXISTS (
          SELECT 1 FROM public.story_events se
          JOIN public.events e ON se.event_id = e.id
          WHERE se.story_id = s.id
            AND public.is_timeline_collaborator(e.timeline_id)
        )
      )
  );
$$;

-- read_stories: delegate the (identical) predicate to the helper so the policy
-- no longer queries story_events/events under RLS.
DROP POLICY IF EXISTS "read_stories" ON public.stories;
CREATE POLICY "read_stories" ON public.stories FOR SELECT
  USING (public.is_story_readable(id));

-- read_story_events: "visible iff the parent story is visible". Was a direct
-- EXISTS over stories (the other half of the cycle); now delegates to the same
-- helper, preserving semantics without re-entering stories' RLS.
DROP POLICY IF EXISTS "read_story_events" ON public.story_events;
CREATE POLICY "read_story_events" ON public.story_events FOR SELECT
  USING (public.is_story_readable(story_id));

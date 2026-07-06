-- ============================================================================
-- 00026_delete_category_reparenting_children.sql
--
-- Atomic "reparent children then delete" for the category taxonomy (issue #59,
-- wireframe 24 annotation #6 "Option A"). The service previously performed this
-- as two separate PostgREST calls (UPDATE then DELETE), which is not atomic:
-- if the DELETE failed the node was left stranded among its former children,
-- and a child inserted between the two statements could be cascade-deleted.
--
-- This function does both in a single transaction so they commit or roll back
-- together. A FOR UPDATE lock on the target row serializes concurrent inserts
-- of new children: such an insert takes a FOR KEY SHARE lock on the parent for
-- the FK check, which blocks until this function commits (having deleted the
-- row), after which the insert fails its FK check rather than being silently
-- cascaded away.
--
-- SECURITY INVOKER (the default) so RLS applies — the caller can only reparent
-- and delete categories they own; a target owned by another user is invisible
-- and raises "not found". search_path='' + schema-qualified refs follow the
-- hardening pattern from 00010_function_search_path_hardening.sql.
--
-- The raw subtree cascade ("Option B") remains available as a plain DELETE on
-- categories (parent_category_id ... ON DELETE CASCADE); this function is the
-- subtree-preserving alternative.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_category_reparenting_children(
  p_category_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_parent_id UUID;
BEGIN
  -- Resolve the target's own parent; children inherit it (grandparent, or NULL
  -- for a root node). FOR UPDATE locks the row so a concurrent child insert is
  -- serialized against the delete below.
  SELECT parent_category_id INTO v_parent_id
  FROM public.categories
  WHERE id = p_category_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'category % not found', p_category_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Move direct children up to the target's parent. They move to the target's
  -- own ancestor (never into its subtree), so this cannot introduce a cycle.
  UPDATE public.categories
  SET parent_category_id = v_parent_id
  WHERE parent_category_id = p_category_id;

  -- The target is now childless; delete only it. Its own event_categories tags
  -- are removed by the ON DELETE CASCADE on that junction.
  DELETE FROM public.categories WHERE id = p_category_id;
END;
$$;

-- Destructive mutation: keep it off the anonymous (read-only) role and grant
-- least privilege to the writing roles. anon is read-only per ADR-0034.
REVOKE ALL ON FUNCTION public.delete_category_reparenting_children(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_category_reparenting_children(UUID)
  TO authenticated, service_role;

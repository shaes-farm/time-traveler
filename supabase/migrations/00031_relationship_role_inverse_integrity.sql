-- ============================================================================
-- 00031_relationship_role_inverse_integrity.sql
--
-- Close the integrity gap around `relationship_roles.inverse_key` (PR #439
-- review). Recorded in
-- docs/adr/adr-0042-relationship-role-inverse-integrity.md.
--
-- Why
-- ---
-- 00029 gave `relationship_types.inverse_key` a self-FK (lines 82-84) but left
-- `relationship_roles.inverse_key` a bare VARCHAR(100). Two consequences, both
-- reachable from the admin CRUD surface added in #428:
--
--   1. Nothing removed a dangling reference. Deleting the `child` role left
--      `parent.inverse_key = 'child'` pointing at a row that no longer exists,
--      and the composite FK on character_relationships would then reject the
--      reciprocal row the pairing exists to describe.
--   2. Nothing kept the pairing two-sided. Setting `parent.inverse_key = 'child'`
--      through PostgREST did not make `child.inverse_key = 'parent'`. Involution
--      — inverse(inverse(x)) = x — was asserted only against the *seeded*
--      corpus, by 00030_seed_relationship_vocabulary_test.sql lines 134-140. That
--      catches drift in the seed; it does not stop a bad write.
--
-- Shape
-- -----
--   * A composite self-FK (type_key, inverse_key) -> (type_key, key). Composite
--     because relationship_roles' PK is composite and because pairing is always
--     WITHIN a type — a scalar FK on inverse_key alone could not express
--     "a sibling of this same type" and there is no unique key on `key` to
--     reference. ON DELETE SET NULL (inverse_key) uses the PG15+ column list so
--     only the reference is nulled; type_key is NOT NULL and must survive.
--   * Two write RPCs that keep both sides of a pairing in step atomically. An
--     explicit function rather than a trigger, following the precedent of
--     00026_delete_category_reparenting_children.sql: the multi-row effect is
--     visible at the call site instead of firing invisibly under a plain UPDATE.
--
-- NOT added: a CHECK (inverse_key IS DISTINCT FROM key). Self-inversion is the
-- sanctioned encoding for a symmetric role and 16 of the 32 rows seeded by
-- 00030 use it — spouse <-> spouse, sibling <-> sibling, cousin <-> cousin
-- (00029 line 108 documents it, 00030 lines 165-166 repeat it). It is the
-- role-level analogue of relationship_types.is_symmetric, and it satisfies
-- involution trivially. Such a CHECK would have failed to apply against the
-- seeded vocabulary. See ADR-0042 ALT-005.
--
-- Rollback intent: DROP the two functions and the helper, DROP the FK
-- constraint and the index. Nothing here rewrites data, so a rollback restores
-- the 00029 state exactly.
-- ============================================================================

-- ============================================================================
-- 1. Composite self-FK — no dangling role inverses
-- ============================================================================

-- Named explicitly rather than taking the generated
-- `relationship_roles_type_key_inverse_key_fkey`, so it matches the shape the
-- service layer already maps for types (`relationship_types_inverse_key_fkey`,
-- 00029 lines 82-84) and an unknown inverse can be described in prose.
ALTER TABLE public.relationship_roles
  ADD CONSTRAINT relationship_roles_inverse_key_fkey
  FOREIGN KEY (type_key, inverse_key)
  REFERENCES public.relationship_roles (type_key, key)
  ON UPDATE CASCADE
  ON DELETE SET NULL (inverse_key);

-- ON DELETE SET NULL probes the referencing side by (type_key, inverse_key);
-- the PK leads with (type_key, key) and cannot serve that probe. Same reason
-- 00029 line 146 indexes character_relationships.relationship_type. Partial:
-- most roles in a growing vocabulary carry no inverse.
CREATE INDEX relationship_roles_inverse_key_idx
  ON public.relationship_roles (type_key, inverse_key)
  WHERE inverse_key IS NOT NULL;

-- ============================================================================
-- 2. Pairing helper
--
-- Makes `p_key`'s inverse pairing two-sided and exclusive, given that
-- `p_key.inverse_key` has already been written:
--
--   a. Any OTHER role still claiming p_key as its inverse — the partner p_key
--      just moved away from, or a stale claimant — is cleared. The new partner
--      is exempt; it is about to claim p_key legitimately.
--   b. Any OTHER role claiming the NEW partner is cleared, so a pairing is
--      stolen cleanly rather than leaving two roles both naming the same
--      partner while the partner names only one of them.
--   c. The new partner points back at p_key.
--
-- Written as set-based predicates rather than read-then-write on captured old
-- values: the same statements repair a corpus that was already one-sided
-- (rows written before this migration), and they are idempotent.
--
-- A self-inverse target (p_inverse_key = p_key) needs (a) only — the row
-- already points at itself, and there is no partner to update.
--
-- SECURITY INVOKER so RLS applies: every statement below is subject to the
-- is_admin() UPDATE policy from 00029, exactly as a direct write would be.
-- search_path = '' + schema-qualified refs per 00010_function_search_path_hardening.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.pair_relationship_role_inverse(
  p_type_key    VARCHAR(100),
  p_key         VARCHAR(100),
  p_inverse_key VARCHAR(100)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- (a) Release roles that still name p_key but are no longer its partner.
  UPDATE public.relationship_roles
     SET inverse_key = NULL
   WHERE type_key = p_type_key
     AND inverse_key = p_key
     AND key <> p_key
     AND key IS DISTINCT FROM p_inverse_key;

  IF p_inverse_key IS NULL OR p_inverse_key = p_key THEN
    RETURN;
  END IF;

  -- (b) Take the partner away from whoever else was claiming it. The partner
  -- itself is excluded (it may have been self-inverse; (c) overwrites that),
  -- and so is p_key, which is the one claim being kept.
  UPDATE public.relationship_roles
     SET inverse_key = NULL
   WHERE type_key = p_type_key
     AND inverse_key = p_inverse_key
     AND key <> p_inverse_key
     AND key <> p_key;

  -- (c) Complete the pairing. If the partner does not exist this affects zero
  -- rows; the caller's own write already failed the FK in that case.
  UPDATE public.relationship_roles
     SET inverse_key = p_key
   WHERE type_key = p_type_key
     AND key = p_inverse_key;
END;
$$;

-- ============================================================================
-- 3. set_relationship_role — update one role and re-pair its inverse
--
-- Partial-patch semantics, merged INSIDE the lock. The caller states only the
-- columns it is changing; everything else is read from the current row after
-- the type's roles are locked, so there is no window between "read the row"
-- and "write the row" for a second admin to slip through. An earlier revision
-- of this function took full-replacement arguments and left the merge to the
-- service layer, which had to SELECT the row in a separate, unlocked round
-- trip — two concurrent partial edits (a label rename and an is_active toggle)
-- both merged the same pre-edit snapshot and the later write silently reverted
-- the earlier one. The lock existed but was acquired after the race window.
-- See ADR-0042 (NEG-003, POS-006).
--
-- "Leave this column alone" encodings:
--   * label / sort_order / is_active: NULL. None of the three has NULL as a
--     legal value (label is NOT NULL and schema-validated non-empty; the other
--     two are NOT NULL DEFAULTed), so NULL is unambiguous and COALESCE against
--     the locked current value is enough.
--   * inverse_key: NULL is a *meaningful* value there — it clears a pairing —
--     so the sentinel cannot be the value itself. p_set_inverse_key is the
--     explicit "I am writing this column" flag. Only when it is true does the
--     function write inverse_key and run the pairing helper; p_inverse_key is
--     ignored otherwise, whatever it holds.
--
-- `type_key` and `key` address the row and are not editable here — renaming a
-- key cascades into character_relationships and stays a SQL operation per
-- ADR-0041.
--
-- The type's roles are locked in key order up front. That serializes two
-- admins re-pairing overlapping roles concurrently, and the deterministic order
-- means they cannot deadlock. A type holds a handful of roles (16 at the widest
-- in 00030), and this is an admin-only, low-frequency operation. The current
-- row is then re-read under that held lock: no other transaction can have
-- changed it between the lock and the read, and none can change it between the
-- read and the UPDATE.
--
-- Under RLS a non-admin sees no lockable row (SELECT ... FOR UPDATE applies the
-- UPDATE policy's USING clause), so the merge read finds nothing and the
-- function raises no_data_found — the same "invisible target reads as missing"
-- behaviour as 00026_delete_category_reparenting_children.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_relationship_role(
  p_type_key        VARCHAR(100),
  p_key             VARCHAR(100),
  p_label           TEXT         DEFAULT NULL,
  p_inverse_key     VARCHAR(100) DEFAULT NULL,
  p_set_inverse_key BOOLEAN      DEFAULT false,
  p_sort_order      INTEGER      DEFAULT NULL,
  p_is_active       BOOLEAN      DEFAULT NULL
)
RETURNS public.relationship_roles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_current public.relationship_roles;
  v_row     public.relationship_roles;
BEGIN
  PERFORM 1
     FROM public.relationship_roles
    WHERE type_key = p_type_key
    ORDER BY key
      FOR UPDATE;

  -- The lock above is already held, so this read is the merge base no other
  -- session can invalidate. FOR UPDATE again is a no-op on an already-locked
  -- row; it is kept so RLS filters this read exactly as it filters the lock.
  SELECT *
    INTO v_current
    FROM public.relationship_roles
   WHERE type_key = p_type_key
     AND key      = p_key
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'relationship role %.% not found', p_type_key, p_key
      USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.relationship_roles
     SET label       = COALESCE(p_label, v_current.label),
         inverse_key = CASE WHEN p_set_inverse_key
                            THEN p_inverse_key
                            ELSE v_current.inverse_key
                       END,
         sort_order  = COALESCE(p_sort_order, v_current.sort_order),
         is_active   = COALESCE(p_is_active, v_current.is_active)
   WHERE type_key = p_type_key
     AND key      = p_key
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'relationship role %.% not found', p_type_key, p_key
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Only re-pair when the caller actually wrote inverse_key. A patch that did
  -- not mention it must not disturb sibling rows: the helper is set-based and
  -- would otherwise re-assert (and steal) pairings on an unrelated edit.
  -- Never touches the target row, so v_row stays the row that was written.
  IF p_set_inverse_key THEN
    PERFORM public.pair_relationship_role_inverse(p_type_key, p_key, p_inverse_key);
  END IF;

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 4. create_relationship_role — insert one role and pair it in the same
--    transaction
--
-- Kept separate from set_relationship_role rather than folded into an upsert:
-- an upsert would turn "create a role whose key is already taken" from a 23505
-- the admin UI reports as a name clash into a silent overwrite of the existing
-- role. The insert's own errors (23505 duplicate key, 23503 unknown type or
-- unknown inverse, 42501 RLS refusal for a non-admin) are all preserved.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_relationship_role(
  p_type_key    VARCHAR(100),
  p_key         VARCHAR(100),
  p_label       TEXT,
  p_inverse_key VARCHAR(100),
  p_sort_order  INTEGER,
  p_is_active   BOOLEAN
)
RETURNS public.relationship_roles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_row public.relationship_roles;
BEGIN
  PERFORM 1
     FROM public.relationship_roles
    WHERE type_key = p_type_key
    ORDER BY key
      FOR UPDATE;

  INSERT INTO public.relationship_roles
    (type_key, key, label, inverse_key, sort_order, is_active)
  VALUES
    (p_type_key, p_key, p_label, p_inverse_key, p_sort_order, p_is_active)
  RETURNING * INTO v_row;

  PERFORM public.pair_relationship_role_inverse(p_type_key, p_key, p_inverse_key);

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 5. EXECUTE grants (ADR-0034 least privilege, 00026 precedent)
--
-- Mutations: off the anonymous read-only role, granted to the writing roles.
-- RLS still decides whether the writes land, so exposure here is the same as
-- the table's own INSERT/UPDATE grants.
-- ============================================================================

REVOKE ALL ON FUNCTION public.pair_relationship_role_inverse(
  VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pair_relationship_role_inverse(
  VARCHAR, VARCHAR, VARCHAR) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_relationship_role(
  VARCHAR, VARCHAR, TEXT, VARCHAR, BOOLEAN, INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_relationship_role(
  VARCHAR, VARCHAR, TEXT, VARCHAR, BOOLEAN, INTEGER, BOOLEAN)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_relationship_role(
  VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_relationship_role(
  VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, BOOLEAN) TO authenticated, service_role;

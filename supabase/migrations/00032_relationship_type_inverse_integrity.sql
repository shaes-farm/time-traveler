-- ============================================================================
-- 00032_relationship_type_inverse_integrity.sql
--
-- Extend the ADR-0042 role-inverse treatment up one level, to
-- `relationship_types.inverse_key`. Recorded in
-- docs/adr/adr-0043-relationship-type-inverse-integrity.md.
--
-- Why
-- ---
-- 00031 closed one-sided pairing for ROLES. The type-level inverse was left
-- exactly as 00029 wrote it: a self-FK (00029 lines 82-84) that stops a
-- dangling reference and nothing more. That was survivable only because 00030
-- leaves `inverse_key` NULL on all 32 seeded types (00030 line 37) — nothing
-- had ever written one. The admin CRUD surface from #428 makes it writable, and
-- the consequences are worse at this level than at the role level:
--
--   1. Nothing kept the pairing two-sided. Setting `superseded.inverse_key =
--      'friendship'` through PostgREST did not make `friendship.inverse_key =
--      'superseded'`. The reciprocal writer takes involution as given —
--      `reciprocalTypeFor` (character-relationship-service.ts lines 135-142)
--      resolves A->B's reciprocal as `friendship`, then `deleteReciprocalRow`
--      (lines 555-592) goes looking for the B->A `friendship` row it assumes it
--      wrote. Against a one-sided inverse that row never existed, the delete
--      matches nothing, and the original row is orphaned.
--   2. `relationship_types_symmetric_has_no_inverse` (00029 lines 96-97) could
--      be tripped by a row the admin never touched: naming a symmetric type as
--      an inverse is only illegal once the pairing writes back to it.
--
-- Shape — the same three layers as 00031, minus the FK it already had:
--   * A CHECK forbidding self-inversion (see below).
--   * A pairing helper making the write two-sided and exclusive.
--   * Two write RPCs that hold the merge and the pairing inside one lock.
--
-- ADDED here, unlike 00031: CHECK (inverse_key IS DISTINCT FROM key). At the
-- role level, self-inversion IS the symmetric encoding and 16 of the 32 seeded
-- roles use it (00031 lines 37-43), so the constraint was rejected there. At
-- the type level `is_symmetric` carries that meaning — 00029 lines 76-80 make
-- the three-way encoding explicit — so a self-inverse type is a second, mute
-- spelling of a state the schema already has a column for, and one that
-- `symmetryModeOf` in the admin form mappers cannot represent. No seeded row
-- sets inverse_key at all, so it applies cleanly. See ADR-0043 ALT-003.
--
-- Rollback intent: DROP the three functions, DROP the CHECK and the index.
-- Nothing here rewrites data, so a rollback restores the 00029 state exactly.
-- ============================================================================

-- ============================================================================
-- 1. No self-inverse types
-- ============================================================================

ALTER TABLE public.relationship_types
  ADD CONSTRAINT relationship_types_inverse_key_not_self
  CHECK (inverse_key IS DISTINCT FROM key);

-- The self-FK's ON DELETE SET NULL (00029 lines 82-84) probes the referencing
-- side by inverse_key, which the PK on `key` cannot serve. Same reason 00029
-- line 146 indexes character_relationships.relationship_type, and 00031 line 69
-- indexes the role equivalent. Partial: most types carry no inverse — all 32
-- seeded ones do not.
CREATE INDEX relationship_types_inverse_key_idx
  ON public.relationship_types (inverse_key)
  WHERE inverse_key IS NOT NULL;

-- ============================================================================
-- 2. Pairing helper
--
-- Makes `p_key`'s inverse pairing two-sided and exclusive, given that
-- `p_key.inverse_key` has already been written. Mirrors
-- pair_relationship_role_inverse (00031 lines 99-139):
--
--   a. Any OTHER type still claiming p_key as its inverse — the partner p_key
--      just moved away from, or a stale claimant — is cleared. The new partner
--      is exempt; it is about to claim p_key legitimately.
--   b. Any OTHER type claiming the NEW partner is cleared, so a pairing is
--      stolen cleanly rather than leaving two types both naming the same
--      partner while the partner names only one of them.
--   c. The new partner points back at p_key.
--
-- Set-based predicates rather than read-then-write on captured old values: the
-- same statements repair a corpus that was already one-sided, and they are
-- idempotent.
--
-- The one step the role helper does not need is the symmetric-partner check.
-- Writing back to a symmetric partner would violate
-- relationship_types_symmetric_has_no_inverse, and the admin would get a bare
-- 23514 naming a row they never edited. Raised as 22023 with a sentence
-- instead, matching the "a SQLSTATE the service can turn into prose" contract
-- the rest of this vocabulary's write path follows. (Scope note: p_key's OWN
-- symmetric/inverse combination is not checked here — that pair is written
-- together by the callers below and the CHECK fires on the target row itself,
-- which is the row the admin is editing.)
--
-- Self-inversion needs no branch: section 1's CHECK means the caller's own
-- write has already failed by the time it would matter.
--
-- SECURITY INVOKER so RLS applies: every statement below is subject to the
-- is_admin() UPDATE policy from 00029, exactly as a direct write would be.
-- search_path = '' + schema-qualified refs per 00010_function_search_path_hardening.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.pair_relationship_type_inverse(
  p_key         VARCHAR(100),
  p_inverse_key VARCHAR(100)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_partner_is_symmetric BOOLEAN;
BEGIN
  -- (a) Release types that still name p_key but are no longer its partner.
  UPDATE public.relationship_types
     SET inverse_key = NULL
   WHERE inverse_key = p_key
     AND key <> p_key
     AND key IS DISTINCT FROM p_inverse_key;

  IF p_inverse_key IS NULL THEN
    RETURN;
  END IF;

  -- Refuse before mutating anything else. A missing partner is left to the
  -- caller's own FK failure, exactly as step (c) is.
  SELECT is_symmetric
    INTO v_partner_is_symmetric
    FROM public.relationship_types
   WHERE key = p_inverse_key
     FOR UPDATE;

  IF FOUND AND v_partner_is_symmetric THEN
    RAISE EXCEPTION
      'relationship type % is symmetric and cannot be used as an inverse', p_inverse_key
      USING ERRCODE = '22023';
  END IF;

  -- (b) Take the partner away from whoever else was claiming it.
  UPDATE public.relationship_types
     SET inverse_key = NULL
   WHERE inverse_key = p_inverse_key
     AND key <> p_inverse_key
     AND key <> p_key;

  -- (c) Complete the pairing. If the partner does not exist this affects zero
  -- rows; the caller's own write already failed the FK in that case.
  UPDATE public.relationship_types
     SET inverse_key = p_key
   WHERE key = p_inverse_key;
END;
$$;

-- ============================================================================
-- 3. set_relationship_type — update one type and re-pair its inverse
--
-- Partial-patch semantics merged INSIDE the lock, for the reasons ADR-0042
-- NEG-003 records: the previous service-layer implementation read the row in a
-- separate unlocked round trip so it could evaluate the symmetry invariant
-- against the merged row, and two concurrent partial edits each merged the same
-- pre-edit snapshot. Moving the merge in here removes that window and removes
-- the pre-read with it — the CHECK now sees a coherent row by construction.
--
-- "Leave this column alone" encodings:
--   * label / category_key / sort_order / is_active: NULL. None has NULL as a
--     legal value (all four are NOT NULL), so COALESCE against the locked
--     current value is unambiguous.
--   * description: NULL is meaningful there (it clears the text), so
--     p_set_description is the explicit "I am writing this column" flag.
--   * the symmetry quad — is_symmetric, inverse_key, direction_verb,
--     symmetric_noun — is governed by ONE flag, p_set_symmetry, and written as
--     a unit. Not four flags: the columns are mutually constrained (a symmetric
--     type must have no inverse and reads with symmetric_noun; a directed one
--     reads with direction_verb), so a patch that moved one without the others
--     could only ever produce a row the CHECK rejects or the UI cannot render.
--     The admin form already groups them exactly this way — `symmetryFields` in
--     vocabulary-form-mappers.ts — and this is that grouping made binding.
--
-- `key` addresses the row and is not editable here: renaming it cascades into
-- character_relationships and stays a SQL operation per ADR-0041.
--
-- Every type row is locked in key order up front. Type-level pairing is
-- table-wide, not scoped like the role helper's single parent type, so the lock
-- has to be too; the deterministic order means concurrent callers cannot
-- deadlock. The vocabulary is 32 rows and this is an admin-only, low-frequency
-- operation. The current row is then re-read under that held lock, so nothing
-- can change it between the lock, the read, and the UPDATE.
--
-- Under RLS a non-admin sees no lockable row (SELECT ... FOR UPDATE applies the
-- UPDATE policy's USING clause), so the merge read finds nothing and the
-- function raises no_data_found — the same "invisible target reads as missing"
-- behaviour as 00031 and 00026_delete_category_reparenting_children.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_relationship_type(
  p_key             VARCHAR(100),
  p_label           TEXT         DEFAULT NULL,
  p_category_key    VARCHAR(50)  DEFAULT NULL,
  p_sort_order      INTEGER      DEFAULT NULL,
  p_is_active       BOOLEAN      DEFAULT NULL,
  p_description     TEXT         DEFAULT NULL,
  p_set_description BOOLEAN      DEFAULT false,
  p_is_symmetric    BOOLEAN      DEFAULT NULL,
  p_inverse_key     VARCHAR(100) DEFAULT NULL,
  p_direction_verb  TEXT         DEFAULT NULL,
  p_symmetric_noun  TEXT         DEFAULT NULL,
  p_set_symmetry    BOOLEAN      DEFAULT false
)
RETURNS public.relationship_types
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_current public.relationship_types;
  v_row     public.relationship_types;
BEGIN
  PERFORM 1
     FROM public.relationship_types
    ORDER BY key
      FOR UPDATE;

  -- The lock above is already held, so this read is the merge base no other
  -- session can invalidate. FOR UPDATE again is a no-op on an already-locked
  -- row; it is kept so RLS filters this read exactly as it filters the lock.
  SELECT *
    INTO v_current
    FROM public.relationship_types
   WHERE key = p_key
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'relationship type % not found', p_key
      USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.relationship_types
     SET label          = COALESCE(p_label, v_current.label),
         category_key   = COALESCE(p_category_key, v_current.category_key),
         sort_order     = COALESCE(p_sort_order, v_current.sort_order),
         is_active      = COALESCE(p_is_active, v_current.is_active),
         description    = CASE WHEN p_set_description
                               THEN p_description
                               ELSE v_current.description
                          END,
         -- The quad moves together or not at all. is_symmetric is NOT NULL, so
         -- it falls back to the current value rather than writing a NULL a
         -- caller left out of an otherwise-stated symmetry patch.
         is_symmetric   = CASE WHEN p_set_symmetry
                               THEN COALESCE(p_is_symmetric, v_current.is_symmetric)
                               ELSE v_current.is_symmetric
                          END,
         inverse_key    = CASE WHEN p_set_symmetry
                               THEN p_inverse_key
                               ELSE v_current.inverse_key
                          END,
         direction_verb = CASE WHEN p_set_symmetry
                               THEN p_direction_verb
                               ELSE v_current.direction_verb
                          END,
         symmetric_noun = CASE WHEN p_set_symmetry
                               THEN p_symmetric_noun
                               ELSE v_current.symmetric_noun
                          END
   WHERE key = p_key
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'relationship type % not found', p_key
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Only re-pair when the caller actually wrote the quad. A patch that did not
  -- mention it must not disturb sibling rows: the helper is set-based and would
  -- otherwise re-assert (and steal) pairings on an unrelated edit such as a
  -- rename or a ▲▼ reorder. Never touches the target row, so v_row stays the
  -- row that was written.
  IF p_set_symmetry THEN
    PERFORM public.pair_relationship_type_inverse(p_key, v_row.inverse_key);
  END IF;

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 4. create_relationship_type — insert one type and pair it in the same
--    transaction
--
-- Kept separate from set_relationship_type rather than folded into an upsert,
-- for the reason 00031 lines 256-260 gives: an upsert would turn "create a type
-- whose key is already taken" from a 23505 the admin UI reports as a name clash
-- into a silent overwrite. The insert's own errors (23505 duplicate key, 23503
-- unknown category or unknown inverse, 23514 the two CHECKs, 42501 RLS refusal
-- for a non-admin) are all preserved.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_relationship_type(
  p_key            VARCHAR(100),
  p_label          TEXT,
  p_category_key   VARCHAR(50),
  p_sort_order     INTEGER,
  p_is_symmetric   BOOLEAN,
  p_inverse_key    VARCHAR(100),
  p_direction_verb TEXT,
  p_symmetric_noun TEXT,
  p_description    TEXT,
  p_is_active      BOOLEAN
)
RETURNS public.relationship_types
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_row public.relationship_types;
BEGIN
  PERFORM 1
     FROM public.relationship_types
    ORDER BY key
      FOR UPDATE;

  INSERT INTO public.relationship_types
    (key, label, category_key, sort_order, is_symmetric, inverse_key,
     direction_verb, symmetric_noun, description, is_active)
  VALUES
    (p_key, p_label, p_category_key, p_sort_order, p_is_symmetric, p_inverse_key,
     p_direction_verb, p_symmetric_noun, p_description, p_is_active)
  RETURNING * INTO v_row;

  PERFORM public.pair_relationship_type_inverse(p_key, p_inverse_key);

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 5. EXECUTE grants (ADR-0034 least privilege, 00031 section 5 precedent)
--
-- Mutations: off the anonymous read-only role, granted to the writing roles.
-- RLS still decides whether the writes land, so exposure here is the same as
-- the table's own INSERT/UPDATE grants.
-- ============================================================================

REVOKE ALL ON FUNCTION public.pair_relationship_type_inverse(
  VARCHAR, VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pair_relationship_type_inverse(
  VARCHAR, VARCHAR) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_relationship_type(
  VARCHAR, TEXT, VARCHAR, INTEGER, BOOLEAN, TEXT, BOOLEAN, BOOLEAN, VARCHAR,
  TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_relationship_type(
  VARCHAR, TEXT, VARCHAR, INTEGER, BOOLEAN, TEXT, BOOLEAN, BOOLEAN, VARCHAR,
  TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_relationship_type(
  VARCHAR, TEXT, VARCHAR, INTEGER, BOOLEAN, VARCHAR, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_relationship_type(
  VARCHAR, TEXT, VARCHAR, INTEGER, BOOLEAN, VARCHAR, TEXT, TEXT, TEXT, BOOLEAN)
  TO authenticated, service_role;

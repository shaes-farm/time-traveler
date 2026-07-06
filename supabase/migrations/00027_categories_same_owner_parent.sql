-- ============================================================================
-- 00027_categories_same_owner_parent.sql
--
-- Constrain category nesting to a single owner (issue #59 hardening
-- follow-up). `read_categories` is `USING (true)` (categories are globally
-- readable organizational metadata), and the write policies only check
-- `user_id = auth.uid()` on the mutated row — nothing stops a user from
-- pointing their `parent_category_id` at *another* owner's category. Because
-- that FK is `ON DELETE CASCADE` (00001_initial_schema.sql), a cross-owner
-- parent link lets one owner's delete cascade into another owner's subtree —
-- a cross-tenant data-integrity hole.
--
-- Close it at the schema level (stronger than an RLS `WITH CHECK`, which
-- `service_role` bypasses): replace the single-column self-FK with a COMPOSITE
-- FK that carries `user_id`, so a child can only reference a parent owned by
-- the same user. Roots are unaffected — with the default MATCH SIMPLE, a NULL
-- `parent_category_id` skips the check entirely.
--
-- Requires a UNIQUE key on the referenced columns `(user_id, id)`. `id` is
-- already the PK (so this is trivially satisfiable), but Postgres requires an
-- explicit unique constraint matching a composite FK's target columns.
--
-- Data note: if any pre-existing row already has a cross-owner parent link,
-- the FK creation below will fail loudly (23503) — such rows must be repaired
-- before this migration can apply. No migration seeds category rows, so a
-- fresh `db:reset` applies cleanly.
-- ============================================================================

-- Referenced key for the composite FK. Redundant with the PK on `id`, but
-- required so `(user_id, parent_category_id)` can reference `(user_id, id)`.
ALTER TABLE public.categories
  ADD CONSTRAINT categories_user_id_id_key UNIQUE (user_id, id);

-- Swap the owner-agnostic self-FK for an owner-scoped one. ON DELETE CASCADE is
-- preserved, so subtree deletes still cascade — but only ever within one owner.
ALTER TABLE public.categories
  DROP CONSTRAINT categories_parent_category_id_fkey;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_parent_same_owner_fkey
    FOREIGN KEY (user_id, parent_category_id)
    REFERENCES public.categories (user_id, id)
    ON DELETE CASCADE;

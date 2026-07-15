import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded category (kept flat — the manager shell only needs a couple
 * of visible root nodes to render its populated state; hierarchy/reparenting is
 * covered by the category CRUD spine, category-crud.spec.ts).
 */
export interface SeededCategory {
  slug: string;
  title: string;
}

export interface CategoriesListFixture {
  /** Timestamp shared by every seeded title/slug — isolates this run's rows
   * (and the cleanup) from the shared authenticated DB. */
  stamp: number;
  categories: SeededCategory[];
}

/**
 * Seed a small set of root categories owned by `userId` so the manager-shell
 * spec can assert its populated state (the tree renders, the header summary
 * line appears). Two roots is enough — the category manager has no
 * filter/bulk/pagination surface (it is a tree + inspector, not a list/detail),
 * so unlike the other entity list fixtures this one carries no filterable
 * attributes; the untested shell states (loading / hard-error / true-empty) are
 * forced with route interception rather than data.
 *
 * The manager header counts ALL of the user's categories, so the spec never
 * asserts an exact count (the shared DB is non-deterministic) — it matches the
 * summary line's shape and asserts the seeded nodes are visible by their
 * stamped titles. Pair with {@link cleanupCategoriesList} in an `afterAll` (the
 * #355 teardown note).
 */
export async function seedCategoriesList(
  userId: string,
): Promise<CategoriesListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();

  const categories: SeededCategory[] = [
    {
      slug: `e2e-list-category-a-${stamp}`,
      title: `E2E List ${stamp} — Root A`,
    },
    {
      slug: `e2e-list-category-b-${stamp}`,
      title: `E2E List ${stamp} — Root B`,
    },
  ];

  const { error } = await admin.from("categories").insert(
    categories.map((c) => ({
      user_id: userId,
      slug: c.slug,
      title: c.title,
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, categories };
}

/**
 * Delete every category seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent; call from `afterAll` so a run leaves the shared DB clean.
 */
export async function cleanupCategoriesList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("categories")
    .delete()
    .ilike("slug", `e2e-list-category-%-${stamp}`);
  if (error) {
    throw error;
  }
}

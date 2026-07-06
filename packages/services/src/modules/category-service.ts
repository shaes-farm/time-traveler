import type { SupabaseClient } from "@supabase/supabase-js";
import { categorySchema } from "../schemas/category";
import type { CategoryInput } from "../schemas/category";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export interface CategoryFilters {
  userId?: string;
  parentCategoryId?: string | null;
  page?: number;
  pageSize?: number;
}

/**
 * A category row augmented with recursively nested children for tree views.
 */
export interface CategoryNode extends CategoryRow {
  children?: CategoryNode[];
}

export type CreateCategoryInput = Omit<CategoryInput, "slug"> & {
  slug?: string;
};

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`CategoryService.${context}: ${error.message}`);
  }
}

/**
 * Return a paginated flat list of categories, optionally filtered.
 *
 * @param client - Supabase client instance
 * @param filters - Optional filters: userId, parentCategoryId, page, pageSize
 * @returns Array of category rows ordered by title ascending
 */
export async function getCategories(
  client: SupabaseClient<Database>,
  filters: CategoryFilters = {},
): Promise<CategoryRow[]> {
  const { userId, parentCategoryId, page, pageSize } = filters;

  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client
    .from("categories")
    .select("*")
    .order("title", { ascending: true })
    .range(from, to);

  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (parentCategoryId !== undefined) {
    if (parentCategoryId === null) {
      query = query.is("parent_category_id", null);
    } else {
      query = query.eq("parent_category_id", parentCategoryId);
    }
  }

  const { data, error } = await query;
  assertNoError(error, "getCategories");
  return data ?? [];
}

/**
 * Fetch a single category by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Category UUID
 * @returns The matching category row
 */
export async function getCategoryById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<CategoryRow> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();
  assertNoError(error, "getCategoryById");
  return data;
}

/**
 * Fetch a single category by its owner and slug.
 *
 * @param client - Supabase client instance
 * @param userId - Owner's user UUID
 * @param slug - Category slug
 * @returns The matching category row
 */
export async function getCategoryBySlug(
  client: SupabaseClient<Database>,
  userId: string,
  slug: string,
): Promise<CategoryRow> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();
  assertNoError(error, "getCategoryBySlug");
  return data;
}

/**
 * Create a new category. Slug is auto-generated from the title if not
 * supplied; uniqueness collisions are retried up to 3 times using suffix
 * tokens. The `color` field (if provided) must be a 6-digit hex string
 * like `#a1b2c3` — validated by `categorySchema`.
 *
 * @param client - Supabase client instance
 * @param data - Category data (slug optional)
 * @returns The newly created category row
 */
export async function createCategory(
  client: SupabaseClient<Database>,
  data: CreateCategoryInput,
): Promise<CategoryRow> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createCategory.getUser");
  if (user === null) {
    throw new Error("CategoryService.createCategory: no authenticated user");
  }

  const userId = user.id;

  // Pre-fetch existing slugs to resolve collisions before the insert
  const { data: existing, error: slugError } = await client
    .from("categories")
    .select("slug")
    .eq("user_id", userId);
  assertNoError(slugError, "createCategory(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(data.title);
  const slug = resolveCollision(baseSlug, existingSlugs);

  type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];

  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const validated = categorySchema.parse({ ...data, slug: attemptSlug });

    const { data: row, error: insertError } = await client
      .from("categories")
      .insert({
        ...(validated as unknown as CategoryInsert),
        user_id: userId,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        const suffix = Math.random().toString(36).slice(2, 6);
        const truncated = slug.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/, "");
        attemptSlug = `${truncated}-${suffix}`;
        continue;
      }
      assertNoError(insertError, "createCategory");
    }

    return row as CategoryRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("CategoryService.createCategory: unreachable");
}

/**
 * Throws if assigning `newParentId` as the parent of `categoryId` would create
 * a circular hierarchy — i.e. if `categoryId` is `newParentId` itself, or is an
 * ancestor of `newParentId`.
 *
 * Detection walks the ancestor chain upward from `newParentId` via
 * `parent_category_id`. A cycle would form exactly when `categoryId` appears on
 * that chain, so a single upward walk is sufficient (and cheaper than
 * enumerating `categoryId`'s descendants). A `visited` set guards against an
 * already-corrupt chain looping forever.
 *
 * Detection is service-layer by design — `parent_category_id` is not
 * cycle-constrained at the database level (docs/system-design.md §3.4),
 * consistent with the other self-referential FK cycle guards
 * (see `event-service.assertNoDetailTimelineCycle`).
 *
 * @param client - Supabase client instance
 * @param categoryId - The category being reparented
 * @param newParentId - The candidate parent
 */
export async function assertNoCategoryCycle(
  client: SupabaseClient<Database>,
  categoryId: string,
  newParentId: string,
): Promise<void> {
  const visited = new Set<string>();
  let cursor: string | null = newParentId;

  while (cursor !== null) {
    if (cursor === categoryId) {
      throw new Error(
        "CategoryService.assertNoCategoryCycle: a category cannot be its own " +
          "ancestor (circular hierarchy)",
      );
    }
    if (visited.has(cursor)) {
      // Pre-existing cycle in the stored data; stop rather than loop forever.
      return;
    }
    visited.add(cursor);

    const {
      data,
      error,
    }: {
      data: { parent_category_id: string | null } | null;
      error: { message: string } | null;
    } = await client
      .from("categories")
      .select("parent_category_id")
      .eq("id", cursor)
      .single();
    assertNoError(error, "assertNoCategoryCycle");
    cursor = data?.parent_category_id ?? null;
  }
}

/**
 * Apply a partial update to a category.
 *
 * When the patch reparents the node (sets `parent_category_id` to a non-null
 * value), the assignment is checked against {@link assertNoCategoryCycle} first,
 * so a category can never become its own ancestor. Setting
 * `parent_category_id` to `null` moves the node to root and is always allowed.
 *
 * @param client - Supabase client instance
 * @param id - Category UUID
 * @param data - Partial category fields to update
 * @returns The updated category row
 */
export async function updateCategory(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<CategoryInput>,
): Promise<CategoryRow> {
  const validated = categorySchema.partial().parse(data);

  if (
    validated.parent_category_id !== undefined &&
    validated.parent_category_id !== null
  ) {
    await assertNoCategoryCycle(client, id, validated.parent_category_id);
  }

  const { data: updated, error } = await client
    .from("categories")
    .update(validated)
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "updateCategory");
  return updated;
}

/**
 * Delete a category and its entire subtree (wireframe 24 "Option B — delete
 * subtree", the raw DB cascade). Descendants cascade via the
 * `parent_category_id ... ON DELETE CASCADE` FK, and every affected event is
 * untagged via `event_categories ... ON DELETE CASCADE`.
 *
 * For the safer "reparent children first" path that preserves the subtree, use
 * {@link deleteCategoryReparentingChildren}.
 *
 * @param client - Supabase client instance
 * @param id - Category UUID
 */
export async function deleteCategory(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.from("categories").delete().eq("id", id);
  assertNoError(error, "deleteCategory");
}

/**
 * Delete a single category while preserving its subtree (wireframe 24
 * "Option A — reparent children first"). Direct children are re-pointed to the
 * target's own parent (its grandparent, or `null` for root) before the target
 * is deleted, so descendants survive rather than cascading away.
 *
 * The reparent and delete run atomically inside the
 * `delete_category_reparenting_children` Postgres function
 * (00026_delete_category_reparenting_children.sql): both commit or neither
 * does, and a `FOR UPDATE` lock on the target serializes any concurrent child
 * insert, so a child added mid-operation can't be silently cascade-deleted. The
 * function is `SECURITY INVOKER`, so RLS restricts the caller to their own
 * categories — deleting another owner's category raises a not-found error.
 *
 * The target's own `event_categories` tags are still removed by the DB cascade
 * when it is deleted — only the subtree is preserved, not the target node's own
 * event associations.
 *
 * @param client - Supabase client instance
 * @param id - Category UUID to delete
 */
export async function deleteCategoryReparentingChildren(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await client.rpc("delete_category_reparenting_children", {
    p_category_id: id,
  });
  assertNoError(error, "deleteCategoryReparentingChildren");
}

/**
 * Fetch all categories for a user and assemble them into a nested tree.
 * Root nodes are those with `parent_category_id IS NULL`. The tree is built
 * entirely in-memory from a single DB query.
 *
 * Ordering within every level is deterministic: alphabetical by `title`, with a
 * stable `id` tie-break for equal titles (categories have no `sort_order` and
 * no temporal axis). We build children in the DB's title-ascending row order,
 * then sort each level explicitly so equal-title siblings never reorder across
 * fetches, regardless of the order the map iterates them in.
 *
 * @param client - Supabase client instance
 * @param userId - Owner's user UUID
 * @returns Array of root CategoryNode objects, each with nested `children`
 */
export async function getCategoryTree(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<CategoryNode[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("title", { ascending: true });
  assertNoError(error, "getCategoryTree");

  const rows = data ?? [];
  const nodeMap = new Map<string, CategoryNode>();

  // Prime the map — each row starts with an empty children array
  for (const row of rows) {
    nodeMap.set(row.id, { ...row, children: [] });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodeMap.values()) {
    if (
      node.parent_category_id !== null &&
      node.parent_category_id !== undefined
    ) {
      const parent = nodeMap.get(node.parent_category_id);
      if (parent !== undefined) {
        (parent.children ??= []).push(node);
      } else {
        // Parent not in result set — treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Deterministic ordering: title ascending, then id as a stable tie-break.
  const byTitleThenId = (a: CategoryNode, b: CategoryNode) =>
    a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  roots.sort(byTitleThenId);
  for (const node of nodeMap.values()) {
    node.children?.sort(byTitleThenId);
  }

  return roots;
}

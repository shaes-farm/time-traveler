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
 * Apply a partial update to a category.
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
 * Delete a category by its UUID. Child categories cascade via the FK
 * constraint defined on `parent_category_id`.
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
 * Fetch all categories for a user and assemble them into a nested tree.
 * Root nodes are those with `parent_category_id IS NULL`. The tree is built
 * entirely in-memory from a single DB query.
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

  return roots;
}

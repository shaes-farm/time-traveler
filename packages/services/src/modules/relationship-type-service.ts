import type { SupabaseClient } from "@supabase/supabase-js";
import {
  toVocabulary,
  type RelationshipCategoryMeta,
  type RelationshipVocabulary,
} from "../schemas/relationship-vocabulary";
import type { Database } from "../supabase/types";

/**
 * Reads the relationship vocabulary — the three reference tables introduced in
 * `00029_relationship_vocabulary.sql` (issue #419).
 *
 * The vocabulary is a three-level ontology:
 *
 *   relationship_categories   selector grouping; orders the GROUPS
 *     └─ relationship_types   the vocabulary; orders types WITHIN a group
 *          └─ relationship_roles   the ADR-0009 sub-role taxonomy
 *
 * Both levels of ordering live in data, so no consumer hard-codes a group
 * order. Content ships in `00030_seed_relationship_vocabulary.sql`; a database
 * that has not run it yields an empty vocabulary, which callers must handle.
 */

/** Nested select that returns the whole ordered tree in one round trip. */
const VOCABULARY_SELECT = `
  key, label, description, sort_order, is_active,
  types:relationship_types (
    key, label, category_key, sort_order,
    is_symmetric, inverse_key, direction_verb, symmetric_noun,
    description, is_active,
    roles:relationship_roles (
      type_key, key, label, inverse_key, sort_order, is_active
    )
  )
`;

export interface ListRelationshipCategoriesOptions {
  /**
   * Drop inactive categories, types and roles. Defaults to true — editors
   * should not offer retired vocabulary. Pass false for admin management, where
   * retired entries still need to be visible.
   */
  activeOnly?: boolean;
}

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`RelationshipTypeService.${context}: ${error.message}`);
  }
}

/**
 * Fetch the vocabulary as an ordered category tree.
 *
 * Sorting is applied client-side after the fetch because PostgREST cannot order
 * an embedded resource by a parent's column; the row counts here are small
 * (tens), so this is not a hot path.
 */
export async function listRelationshipCategories(
  client: SupabaseClient<Database>,
  options: ListRelationshipCategoriesOptions = {},
): Promise<RelationshipCategoryMeta[]> {
  const activeOnly = options.activeOnly ?? true;

  const { data, error } = await client
    .from("relationship_categories")
    .select(VOCABULARY_SELECT)
    .order("sort_order", { ascending: true });

  assertNoError(error, "listRelationshipCategories");

  const rows = (data ?? []) as unknown as RelationshipCategoryMeta[];

  return rows
    .filter((category) => !activeOnly || category.is_active)
    .map((category) => ({
      ...category,
      types: (category.types ?? [])
        .filter((type) => !activeOnly || type.is_active)
        .map((type) => ({
          ...type,
          roles: (type.roles ?? [])
            .filter((role) => !activeOnly || role.is_active)
            .sort(bySortOrderThenLabel),
        }))
        .sort(bySortOrderThenLabel),
    }))
    .sort(bySortOrderThenLabel);
}

/**
 * Fetch the vocabulary as a key → metadata lookup, for consumers that need
 * semantics (symmetry, inverse, sub-roles) rather than display ordering.
 */
export async function fetchRelationshipVocabulary(
  client: SupabaseClient<Database>,
  options: ListRelationshipCategoriesOptions = {},
): Promise<RelationshipVocabulary> {
  return toVocabulary(await listRelationshipCategories(client, options));
}

function bySortOrderThenLabel(
  a: { sort_order: number; label: string },
  b: { sort_order: number; label: string },
): number {
  return a.sort_order - b.sort_order || a.label.localeCompare(b.label);
}

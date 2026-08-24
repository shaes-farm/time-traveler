import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertSymmetryInvariant,
  relationshipCategoryCreateSchema,
  relationshipCategoryUpdateSchema,
  relationshipRoleCreateSchema,
  relationshipRoleUpdateSchema,
  relationshipTypeCreateSchema,
  relationshipTypeUpdateSchema,
  toVocabulary,
  type RelationshipCategoryCreateInput,
  type RelationshipCategoryMeta,
  type RelationshipCategoryUpdateInput,
  type RelationshipRoleCreateInput,
  type RelationshipRoleUpdateInput,
  type RelationshipTypeCreateInput,
  type RelationshipTypeUpdateInput,
  type RelationshipVocabulary,
} from "../schemas/relationship-vocabulary";
import type { Database } from "../supabase/types";
import {
  describePostgresError,
  PG_UNIQUE_VIOLATION,
  type PostgresErrorLike,
} from "../utils/postgres-errors";

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

/**
 * Exported so client-side reordering (`vocabulary-tree-utils.ts`) sorts
 * siblings the same way this module fetches them — a mismatched tie-break
 * makes the ▲▼ buttons act on a row other than the one visibly adjacent.
 */
export function bySortOrderThenLabel(
  a: { sort_order: number; label: string },
  b: { sort_order: number; label: string },
): number {
  return a.sort_order - b.sort_order || a.label.localeCompare(b.label);
}

/* ===================================================================== *
 * Writes (issue #428 — the admin CRUD surface)
 *
 * RLS gates every write below on `is_admin()` (00029 lines 166-198), so a
 * non-admin's write fails at the database regardless of what the UI offers.
 * These functions add the *legibility* layer: the four ways this schema bites
 * (delete-in-use, key rename cascading, the symmetry CHECK, duplicate keys) all
 * arrive as bare SQLSTATEs, and each is turned into a sentence here.
 *
 * `key` is absent from every update input by construction. The FKs are
 * ON UPDATE CASCADE, so renaming a key rewrites `relationship_type` on every
 * referencing relationship row; ADR-0041 keeps that a SQL operation.
 * ===================================================================== */

type RelationshipCategoryRow =
  Database["public"]["Tables"]["relationship_categories"]["Row"];
type RelationshipTypeRow =
  Database["public"]["Tables"]["relationship_types"]["Row"];
type RelationshipRoleRow =
  Database["public"]["Tables"]["relationship_roles"]["Row"];

/** Rethrow a write error as a described, context-prefixed Error. */
function assertNoWriteError(
  error: PostgresErrorLike | null,
  context: string,
  options: Parameters<typeof describePostgresError>[1],
): asserts error is null {
  if (error !== null) {
    throw new Error(
      `RelationshipTypeService.${context}: ${describePostgresError(error, options)}`,
    );
  }
}

/* ---------------------------------------------------------------- *
 * Categories
 * ---------------------------------------------------------------- */

const CATEGORY_WRITE_ERRORS = {
  constraints: [
    {
      constraint: "relationship_types_category_key_fkey",
      message:
        "This group still has relationship types in it. Move or remove them first, or deactivate the group instead.",
    },
  ],
  byCode: {
    [PG_UNIQUE_VIOLATION]: "A group with that key already exists.",
  },
} as const;

export async function createRelationshipCategory(
  client: SupabaseClient<Database>,
  input: RelationshipCategoryCreateInput,
): Promise<RelationshipCategoryRow> {
  const values = relationshipCategoryCreateSchema.parse(input);

  const { data, error } = await client
    .from("relationship_categories")
    .insert(values)
    .select()
    .single();

  assertNoWriteError(
    error,
    "createRelationshipCategory",
    CATEGORY_WRITE_ERRORS,
  );
  return data;
}

export async function updateRelationshipCategory(
  client: SupabaseClient<Database>,
  key: string,
  patch: RelationshipCategoryUpdateInput,
): Promise<RelationshipCategoryRow> {
  const values = relationshipCategoryUpdateSchema.parse(patch);

  const { data, error } = await client
    .from("relationship_categories")
    .update(values)
    .eq("key", key)
    .select()
    .single();

  assertNoWriteError(
    error,
    "updateRelationshipCategory",
    CATEGORY_WRITE_ERRORS,
  );
  return data;
}

/**
 * Delete a category. `relationship_types.category_key` is ON DELETE RESTRICT,
 * so this fails while the group still holds any type — including inactive ones,
 * which the UI hides from editors but the FK still counts.
 */
export async function deleteRelationshipCategory(
  client: SupabaseClient<Database>,
  key: string,
): Promise<void> {
  const { error } = await client
    .from("relationship_categories")
    .delete()
    .eq("key", key);

  assertNoWriteError(
    error,
    "deleteRelationshipCategory",
    CATEGORY_WRITE_ERRORS,
  );
}

/* ---------------------------------------------------------------- *
 * Types
 * ---------------------------------------------------------------- */

const TYPE_WRITE_ERRORS = {
  constraints: [
    {
      constraint: "character_relationships_relationship_type_fkey",
      message:
        "Relationships still use this type, so it can't be deleted. Deactivate it instead — existing relationships keep working and it stops being offered for new ones.",
    },
    {
      constraint: "relationship_types_category_key_fkey",
      message: "That group doesn't exist. Pick an existing group.",
    },
    {
      constraint: "relationship_types_inverse_key_fkey",
      message: "The inverse type doesn't exist. Pick an existing type.",
    },
    {
      constraint: "relationship_types_symmetric_has_no_inverse",
      message:
        "A symmetric type cannot have an inverse — its reciprocal carries the same type.",
    },
  ],
  byCode: {
    [PG_UNIQUE_VIOLATION]: "A relationship type with that key already exists.",
  },
} as const;

export async function createRelationshipType(
  client: SupabaseClient<Database>,
  input: RelationshipTypeCreateInput,
): Promise<RelationshipTypeRow> {
  const values = relationshipTypeCreateSchema.parse(input);

  const { data, error } = await client
    .from("relationship_types")
    .insert(values)
    .select()
    .single();

  assertNoWriteError(error, "createRelationshipType", TYPE_WRITE_ERRORS);
  return data;
}

/**
 * Update a type.
 *
 * The symmetry invariant is checked against the *merged* row, not the patch: a
 * patch that sets only `is_symmetric: true` is individually harmless but
 * illegal against a row that already carries an inverse. Reading first costs a
 * round trip and is worth it — the alternative is surfacing a bare 23514 for a
 * field the user never touched.
 */
export async function updateRelationshipType(
  client: SupabaseClient<Database>,
  key: string,
  patch: RelationshipTypeUpdateInput,
): Promise<RelationshipTypeRow> {
  const values = relationshipTypeUpdateSchema.parse(patch);

  if (values.is_symmetric !== undefined || values.inverse_key !== undefined) {
    const { data: current, error: readError } = await client
      .from("relationship_types")
      .select("is_symmetric, inverse_key")
      .eq("key", key)
      .single();

    assertNoError(readError, "updateRelationshipType");
    assertSymmetryInvariant({
      is_symmetric: values.is_symmetric ?? current.is_symmetric,
      inverse_key:
        values.inverse_key !== undefined
          ? values.inverse_key
          : current.inverse_key,
    });
  }

  const { data, error } = await client
    .from("relationship_types")
    .update(values)
    .eq("key", key)
    .select()
    .single();

  assertNoWriteError(error, "updateRelationshipType", TYPE_WRITE_ERRORS);
  return data;
}

/**
 * Delete a type. `character_relationships.relationship_type` is ON DELETE
 * RESTRICT, so this fails whenever any relationship still uses it; its own
 * roles are ON DELETE CASCADE and go with it.
 *
 * Callers should check {@link countRelationshipTypeUsage} first and steer the
 * user to deactivation — reaching this error is the fallback for a row that
 * came into use between the check and the delete.
 */
export async function deleteRelationshipType(
  client: SupabaseClient<Database>,
  key: string,
): Promise<void> {
  const { error } = await client
    .from("relationship_types")
    .delete()
    .eq("key", key);

  assertNoWriteError(error, "deleteRelationshipType", TYPE_WRITE_ERRORS);
}

/* ---------------------------------------------------------------- *
 * Roles
 * ---------------------------------------------------------------- */

const ROLE_WRITE_ERRORS = {
  constraints: [
    {
      constraint: "character_relationships_role_fkey",
      message:
        "Relationships still use this sub-role, so it can't be deleted. Deactivate it instead.",
    },
    {
      constraint: "relationship_roles_type_key_fkey",
      message: "That relationship type doesn't exist.",
    },
    {
      constraint: "relationship_roles_inverse_key_fkey",
      message: "The inverse sub-role doesn't exist. Pick an existing one.",
    },
  ],
  byCode: {
    [PG_UNIQUE_VIOLATION]:
      "That type already has a sub-role with that key. Sub-role keys must be unique within a type.",
    // set_relationship_role raises this (00031/ADR-0042) when the row it was
    // asked to update no longer resolves — deleted, or invisible under RLS.
    P0002: "Couldn’t find that sub-role. It may have just been deleted.",
  },
} as const;

/**
 * Create a role and pair its inverse in one transaction.
 *
 * Goes through `create_relationship_role` (00031/ADR-0042) rather than a plain
 * insert: if `inverse_key` names an existing sibling, the RPC also points that
 * sibling's `inverse_key` back — a plain insert would leave the pairing
 * one-sided until something else touched the partner row.
 */
export async function createRelationshipRole(
  client: SupabaseClient<Database>,
  input: RelationshipRoleCreateInput,
): Promise<RelationshipRoleRow> {
  const values = relationshipRoleCreateSchema.parse(input);

  const { data, error } = await client.rpc("create_relationship_role", {
    p_type_key: values.type_key,
    p_key: values.key,
    p_label: values.label,
    // The generated RPC arg type is `string`, not `string | null` — the
    // Supabase generator never models nullable function parameters.
    p_inverse_key: values.inverse_key as unknown as string,
    p_sort_order: values.sort_order,
    p_is_active: values.is_active,
  });

  assertNoWriteError(error, "createRelationshipRole", ROLE_WRITE_ERRORS);
  return data as RelationshipRoleRow;
}

/**
 * Update a role and re-pair its inverse in one transaction.
 *
 * Roles have a composite PK, so both halves are needed to address one.
 *
 * `set_relationship_role` (00031/ADR-0042) merges the patch *inside* the
 * function, under the row lock it already takes, rather than the caller
 * reading the current row first and merging client-side: a client-side
 * read/merge is not protected by that lock, so two concurrent partial patches
 * (e.g. `toggleActive`'s `{ is_active }}`-only patch racing a label edit)
 * could each merge against the same pre-edit snapshot, and the later write
 * would silently revert the earlier one. Only send the fields this patch
 * actually names, so the DB side can tell "not mentioned" from "explicitly
 * set" — `p_label`/`p_sort_order`/`p_is_active` default to leaving the column
 * alone when omitted (none of the three has NULL as a legal value), and
 * `inverse_key` — where NULL legitimately means "no inverse" — is only
 * touched when `p_set_inverse_key` is sent alongside it.
 */
export async function updateRelationshipRole(
  client: SupabaseClient<Database>,
  typeKey: string,
  key: string,
  patch: RelationshipRoleUpdateInput,
): Promise<RelationshipRoleRow> {
  const values = relationshipRoleUpdateSchema.parse(patch);

  const { data, error } = await client.rpc("set_relationship_role", {
    p_type_key: typeKey,
    p_key: key,
    ...(values.label !== undefined && { p_label: values.label }),
    ...(values.sort_order !== undefined && {
      p_sort_order: values.sort_order,
    }),
    ...(values.is_active !== undefined && { p_is_active: values.is_active }),
    // Sent as a pair, never independently, so the flag can't drift from the
    // value it governs.
    ...(values.inverse_key !== undefined && {
      p_inverse_key: values.inverse_key as unknown as string,
      p_set_inverse_key: true,
    }),
  });

  assertNoWriteError(error, "updateRelationshipRole", ROLE_WRITE_ERRORS);
  return data as RelationshipRoleRow;
}

export async function deleteRelationshipRole(
  client: SupabaseClient<Database>,
  typeKey: string,
  key: string,
): Promise<void> {
  const { error } = await client
    .from("relationship_roles")
    .delete()
    .eq("type_key", typeKey)
    .eq("key", key);

  assertNoWriteError(error, "deleteRelationshipRole", ROLE_WRITE_ERRORS);
}

/* ---------------------------------------------------------------- *
 * Usage counts — the blast radius behind the delete guard rails
 * ---------------------------------------------------------------- */

/**
 * How many relationships across *all* owners use this type.
 *
 * Globally correct for an admin: `read_character_relationships` is
 * `USING (user_id = auth.uid() OR is_admin())` (00011 lines 518-519), so an
 * admin's count spans every user. A non-admin calling this sees only their own
 * rows — harmless, since they cannot reach the delete UI anyway.
 *
 * `head: true` with an exact count is one cheap COUNT(*) with no rows returned,
 * so this is fetched lazily when a confirm dialog opens rather than eagerly for
 * every row in the tree.
 */
export async function countRelationshipTypeUsage(
  client: SupabaseClient<Database>,
  typeKey: string,
): Promise<number> {
  const { count, error } = await client
    .from("character_relationships")
    .select("*", { count: "exact", head: true })
    .eq("relationship_type", typeKey);

  assertNoError(error, "countRelationshipTypeUsage");
  return count ?? 0;
}

/** As {@link countRelationshipTypeUsage}, for one sub-role of a type. */
export async function countRelationshipRoleUsage(
  client: SupabaseClient<Database>,
  typeKey: string,
  roleKey: string,
): Promise<number> {
  const { count, error } = await client
    .from("character_relationships")
    .select("*", { count: "exact", head: true })
    .eq("relationship_type", typeKey)
    .eq("relationship_role", roleKey);

  assertNoError(error, "countRelationshipRoleUsage");
  return count ?? 0;
}

/**
 * How many *other* types name this one as their `inverse_key`.
 *
 * `relationship_types.inverse_key` is `ON DELETE SET NULL` (00029), so
 * deleting a type that other types point their inverse at never fails — it
 * silently un-pairs them. `countRelationshipTypeUsage` alone can't see that:
 * a type can be safe to delete by relationship usage and still break another
 * type's reciprocal pairing. Callers surface this separately from the
 * `character_relationships`-driven blocking count, since it's informational,
 * not a reason deletion is refused.
 */
export async function countRelationshipTypeInverseReferences(
  client: SupabaseClient<Database>,
  typeKey: string,
): Promise<number> {
  const { count, error } = await client
    .from("relationship_types")
    .select("*", { count: "exact", head: true })
    .eq("inverse_key", typeKey)
    .neq("key", typeKey);

  assertNoError(error, "countRelationshipTypeInverseReferences");
  return count ?? 0;
}

/** As {@link countRelationshipTypeInverseReferences}, for one sub-role of a type. */
export async function countRelationshipRoleInverseReferences(
  client: SupabaseClient<Database>,
  typeKey: string,
  roleKey: string,
): Promise<number> {
  const { count, error } = await client
    .from("relationship_roles")
    .select("*", { count: "exact", head: true })
    .eq("type_key", typeKey)
    .eq("inverse_key", roleKey)
    .neq("key", roleKey);

  assertNoError(error, "countRelationshipRoleInverseReferences");
  return count ?? 0;
}

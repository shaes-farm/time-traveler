import { z } from "zod";

/**
 * Shapes for the relationship vocabulary reference tables introduced in
 * `supabase/migrations/00029_relationship_vocabulary.sql` (issue #419).
 *
 * The vocabulary is DATA, not code. Nothing here enumerates the legal set of
 * relationship types — that lives in `relationship_types` and is extended by
 * admins at runtime. These schemas describe the *shape* of a vocabulary row so
 * fetched rows can be validated and typed; membership is enforced by the
 * database FK from `character_relationships.relationship_type`.
 *
 * See docs/adr/adr-0040-relationship-vocabulary-reference-data.md.
 */

/**
 * A vocabulary key: lowercase snake_case slug. This is a *shape* check only.
 * Whether a given key exists is a question for the database.
 */
export const vocabularyKeySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "must be a lowercase snake_case key (e.g. derived_from)",
  );

export const relationshipRoleMetaSchema = z.object({
  type_key: vocabularyKeySchema,
  key: vocabularyKeySchema,
  label: z.string(),
  /** Role the reciprocal row carries (parent ↔ child, spouse ↔ spouse). */
  inverse_key: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

export const relationshipTypeMetaSchema = z.object({
  key: vocabularyKeySchema,
  label: z.string(),
  category_key: vocabularyKeySchema,
  sort_order: z.number().int(),
  /**
   * Reciprocal-edge semantics, three-way:
   *   is_symmetric        → reciprocal row carries the SAME type
   *   inverse_key set     → reciprocal row carries THAT type
   *   neither             → no reciprocal row; a single directed assertion
   */
  is_symmetric: z.boolean(),
  inverse_key: z.string().nullable(),
  /** Verb phrase for directed types, e.g. "mentors" → "Marie mentors Pierre". */
  direction_verb: z.string().nullable(),
  /** Plural noun for symmetric types, e.g. "friends" → "A and B are friends". */
  symmetric_noun: z.string().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  /** Sub-roles. A type accepts a role iff this is non-empty. */
  roles: z.array(relationshipRoleMetaSchema),
});

export const relationshipCategoryMetaSchema = z.object({
  key: vocabularyKeySchema,
  label: z.string(),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  types: z.array(relationshipTypeMetaSchema),
});

/* ------------------------------------------------------------------ *
 * Write inputs (issue #428 — the admin CRUD surface)
 *
 * These mirror the DB constraints in `00029_relationship_vocabulary.sql`
 * exactly, and nothing more. Softer editorial rules — "a directed type ought
 * to carry a direction_verb" — are form-level concerns and live with the admin
 * form mappers, so a SQL-side or script-side caller is never blocked by a
 * preference the database does not actually enforce.
 *
 * Update schemas omit `key` (and `type_key`) deliberately. The FKs are
 * ON UPDATE CASCADE, so renaming a key silently rewrites `relationship_type`
 * on every referencing relationship row; ADR-0041 withholds that from the UI
 * and keeps it a SQL operation. Omitting the field here makes the restriction
 * a type error rather than a convention.
 * ------------------------------------------------------------------ */

/**
 * `relationship_categories.key` is VARCHAR(50) while types and roles are
 * VARCHAR(100). {@link vocabularyKeySchema} allows the wider bound, so the
 * category schema tightens it — otherwise a 51-character key passes validation
 * and fails at the database with a truncation error.
 */
export const categoryKeySchema = vocabularyKeySchema.max(50);

/**
 * Field definitions carry **no defaults**, and the create schemas re-apply them
 * per field below.
 *
 * This split is load-bearing, not stylistic. `.partial()` does not strip a
 * `.default()` — it only makes the key optional, and an absent key still
 * resolves to its default. So a `.partial()` of a defaulted shape turns
 * `update(key, { label: "x" })` into a patch that also writes
 * `description: null, sort_order: 0, is_active: true`, silently resetting three
 * columns the caller never mentioned. Deriving updates from the defaults-free
 * shape keeps a patch to exactly the fields it names.
 */
const categoryFieldsSchema = z.object({
  key: categoryKeySchema,
  label: z.string().min(1, "Label is required"),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

export const relationshipCategoryCreateSchema = categoryFieldsSchema.extend({
  description: categoryFieldsSchema.shape.description.default(null),
  sort_order: categoryFieldsSchema.shape.sort_order.default(0),
  is_active: categoryFieldsSchema.shape.is_active.default(true),
});

export const relationshipCategoryUpdateSchema = categoryFieldsSchema
  .omit({ key: true })
  .partial();

/**
 * Reciprocal-edge semantics are three-way (see {@link relationshipTypeMetaSchema}),
 * and the database rejects exactly one of the four combinations via
 * `relationship_types_symmetric_has_no_inverse`. Mirroring it here turns a
 * `23514` into a field-level validation message.
 *
 * Note the constraint is one-directional: `is_symmetric = false` with a NULL
 * `inverse_key` is legal — a directed assertion with no reciprocal row.
 */
const symmetryRefinement = (
  value: { is_symmetric: boolean; inverse_key: string | null },
  ctx: z.RefinementCtx,
): void => {
  if (value.is_symmetric && value.inverse_key !== null) {
    ctx.addIssue({
      code: "custom",
      path: ["inverse_key"],
      message:
        "A symmetric type cannot have an inverse — its reciprocal carries the same type.",
    });
  }
};

/**
 * Unrefined, defaults-free base — see {@link categoryFieldsSchema} for why the
 * defaults live on the create schema only. Zod 4 also stores refinements inside
 * the schema and rejects `.omit()` on one that carries them, so the create and
 * update schemas both derive from here rather than from one another.
 */
const typeFieldsSchema = z.object({
  key: vocabularyKeySchema,
  label: z.string().min(1, "Label is required"),
  category_key: categoryKeySchema,
  sort_order: z.number().int(),
  is_symmetric: z.boolean(),
  inverse_key: vocabularyKeySchema.nullable(),
  direction_verb: z.string().nullable(),
  symmetric_noun: z.string().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

export const relationshipTypeCreateSchema = typeFieldsSchema
  .extend({
    sort_order: typeFieldsSchema.shape.sort_order.default(0),
    is_symmetric: typeFieldsSchema.shape.is_symmetric.default(true),
    inverse_key: typeFieldsSchema.shape.inverse_key.default(null),
    direction_verb: typeFieldsSchema.shape.direction_verb.default(null),
    symmetric_noun: typeFieldsSchema.shape.symmetric_noun.default(null),
    description: typeFieldsSchema.shape.description.default(null),
    is_active: typeFieldsSchema.shape.is_active.default(true),
  })
  .superRefine(symmetryRefinement);

/**
 * Partial update. The symmetry check deliberately does *not* live here: a
 * refinement sees the patch, not the merged row, so a patch setting only
 * `is_symmetric: true` has no `inverse_key` to test against and would pass
 * while still producing an illegal row. Since
 * `00032_relationship_type_inverse_integrity.sql` (ADR-0043) the merged row is
 * assembled inside `set_relationship_type`, under its lock, and judged there by
 * the `relationship_types_symmetric_has_no_inverse` CHECK — which is why no
 * client-side merged-row guard exists any more.
 */
export const relationshipTypeUpdateSchema = typeFieldsSchema
  .omit({ key: true })
  .partial();

/**
 * `relationship_roles.inverse_key` names a sibling role within the same type.
 * Since `00031_relationship_role_inverse_integrity.sql` (ADR-0042) it is a
 * composite self-FK `(type_key, inverse_key) -> (type_key, key)`, so an unknown
 * or cross-type inverse is rejected by the database rather than by this schema.
 * Involution (`inverse(inverse(x)) = x`) is kept by the `set_relationship_role`
 * / `create_relationship_role` RPCs, not by a constraint — a role write that
 * bypasses them can still leave a pairing one-sided. A self-inverse role is
 * legal and is how a symmetric role (spouse ↔ spouse) is expressed.
 */
const roleFieldsSchema = z.object({
  type_key: vocabularyKeySchema,
  key: vocabularyKeySchema,
  label: z.string().min(1, "Label is required"),
  inverse_key: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

export const relationshipRoleCreateSchema = roleFieldsSchema.extend({
  inverse_key: roleFieldsSchema.shape.inverse_key.default(null),
  sort_order: roleFieldsSchema.shape.sort_order.default(0),
  is_active: roleFieldsSchema.shape.is_active.default(true),
});

export const relationshipRoleUpdateSchema = roleFieldsSchema
  .omit({ type_key: true, key: true })
  .partial();

export type RelationshipCategoryCreateInput = z.input<
  typeof relationshipCategoryCreateSchema
>;
export type RelationshipCategoryUpdateInput = z.infer<
  typeof relationshipCategoryUpdateSchema
>;
export type RelationshipTypeCreateInput = z.input<
  typeof relationshipTypeCreateSchema
>;
export type RelationshipTypeUpdateInput = z.infer<
  typeof relationshipTypeUpdateSchema
>;
export type RelationshipRoleCreateInput = z.input<
  typeof relationshipRoleCreateSchema
>;
export type RelationshipRoleUpdateInput = z.infer<
  typeof relationshipRoleUpdateSchema
>;

export type RelationshipRoleMeta = z.infer<typeof relationshipRoleMetaSchema>;
export type RelationshipTypeMeta = z.infer<typeof relationshipTypeMetaSchema>;
export type RelationshipCategoryMeta = z.infer<
  typeof relationshipCategoryMetaSchema
>;

/**
 * The fetched vocabulary, indexed by type key for O(1) lookup. Consumers that
 * need grouping/ordering for display use the category tree instead; this map is
 * for answering "what are the semantics of this type?".
 */
export type RelationshipVocabulary = ReadonlyMap<string, RelationshipTypeMeta>;

/** Build the lookup map from the ordered category tree. */
export function toVocabulary(
  categories: readonly RelationshipCategoryMeta[],
): RelationshipVocabulary {
  const map = new Map<string, RelationshipTypeMeta>();
  for (const category of categories) {
    for (const type of category.types) {
      map.set(type.key, type);
    }
  }
  return map;
}

/** An empty vocabulary — a fresh database before the baseline seed has run. */
export const EMPTY_VOCABULARY: RelationshipVocabulary = new Map();

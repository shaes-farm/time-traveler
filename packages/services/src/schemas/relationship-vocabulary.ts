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

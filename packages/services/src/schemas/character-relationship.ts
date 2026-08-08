import { z } from "zod";
import { temporalDataSchema, compareTemporal } from "./temporal";
import {
  vocabularyKeySchema,
  type RelationshipVocabulary,
} from "./relationship-vocabulary";

// ---------------------------------------------------------------------------
// relationship_type is reference data, not an enum
// ---------------------------------------------------------------------------
//
// The legal set of relationship types lives in the `relationship_types` table
// (supabase/migrations/00029_relationship_vocabulary.sql) and is extended by
// admins at runtime — adding a type is an INSERT, not a migration. Membership is
// enforced by the FK on character_relationships.relationship_type; a bad value
// comes back from PostgREST as 23503, which the service maps to a readable
// error.
//
// So this schema validates the *shape* of a key and nothing more, matching how
// every other FK-referenced field in this package is handled (category.ts,
// event.ts and timeline.ts all validate `z.string().uuid()` and let the FK
// decide existence). Enumerating the values here would relocate the problem
// #419 set out to solve from SQL into TypeScript.
//
// Callers holding the fetched vocabulary can opt into value-level checking via
// `makeCharacterRelationshipSchema(vocabulary)` for pre-flight editor errors.
// That check is advisory: a client whose cache predates a newly added type must
// never block a write the database would accept.
//
// Directionality note (closes the long-standing #32 `is_bidirectional`
// question): symmetry is per-TYPE vocabulary metadata, not a per-row column.
// `relationship_types.is_symmetric` and `.inverse_key` decide whether a
// reciprocal row is written; see `computeReciprocalRow`.
//
// See docs/adr/adr-0040-relationship-vocabulary-reference-data.md.

export const relationshipTypeKeySchema = vocabularyKeySchema;

/**
 * A relationship type key. Deliberately an open string: the closed set is data,
 * so a union type here would assert knowledge the code does not have.
 */
export type RelationshipTypeKey = string;

/**
 * Returns true if `type` accepts a sub-role. Derived data — a type accepts a
 * role iff it has `relationship_roles` rows. Unknown types accept none.
 */
export function typeAcceptsRole(
  type: string,
  vocabulary: RelationshipVocabulary,
): boolean {
  const meta = vocabulary.get(type);
  return meta !== undefined && meta.roles.length > 0;
}

/**
 * Validates a (type, role) pair against the fetched vocabulary. Returns null if
 * valid, or a human-readable error. A NULL role is always valid — mirroring the
 * composite FK, where a NULL in any referencing column skips the check.
 *
 * Mirrors `character_relationships_role_fkey` so the editor can surface a typed
 * error before a round trip; the database remains the authority.
 */
export function validateTypeRoleCombination(
  type: string,
  role: string | null | undefined,
  vocabulary: RelationshipVocabulary,
): string | null {
  if (role === null || role === undefined) {
    return null;
  }
  const meta = vocabulary.get(type);
  if (meta === undefined) {
    // Unknown to this client — possibly a type added since the vocabulary was
    // fetched. Defer to the database rather than rejecting a legal write.
    return null;
  }
  if (meta.roles.length === 0) {
    return `relationship_role must be null for relationship_type "${type}"`;
  }
  return meta.roles.some((r) => r.key === role)
    ? null
    : `relationship_role "${role}" is not a valid sub-role of "${type}"`;
}

// Base object schema without cross-field refinements — needed separately
// because Zod v4 does not support .pick() or .partial() on refined schemas.
// Use characterRelationshipBaseSchema when you need to derive a sub-schema;
// use characterRelationshipSchema for full validation including temporal ordering.
export const characterRelationshipBaseSchema = z.object({
  character_id: z.string().uuid(),
  related_character_id: z.string().uuid(),
  relationship_type: relationshipTypeKeySchema,
  relationship_role: z.string().nullable().optional(),
  description: z.string().optional(),
  start_temporal: temporalDataSchema.optional(),
  end_temporal: temporalDataSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Shared temporal-ordering refinement. The DB has no CHECK for this, so
 * validation lives here.
 */
function refineTemporalOrder(
  data: z.infer<typeof characterRelationshipBaseSchema>,
  ctx: z.RefinementCtx,
): void {
  if (data.start_temporal !== undefined && data.end_temporal !== undefined) {
    if (compareTemporal(data.start_temporal, data.end_temporal) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "start_temporal must not be later than end_temporal",
        path: ["end_temporal"],
      });
    }
  }
}

/**
 * Default schema: shape only. Used by the service on every write; type and
 * (type, role) validity are enforced by the database FKs.
 */
export const characterRelationshipSchema =
  characterRelationshipBaseSchema.superRefine(refineTemporalOrder);

/**
 * Vocabulary-aware variant, for callers that have already fetched the
 * vocabulary — the admin editor — so an invalid (type, role) pair surfaces as a
 * field error instead of a round trip. Unknown types deliberately pass through
 * to the database; see `validateTypeRoleCombination`.
 */
export function makeCharacterRelationshipSchema(
  vocabulary: RelationshipVocabulary,
) {
  return characterRelationshipBaseSchema.superRefine((data, ctx) => {
    refineTemporalOrder(data, ctx);
    const roleError = validateTypeRoleCombination(
      data.relationship_type,
      data.relationship_role,
      vocabulary,
    );
    if (roleError !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: roleError,
        path: ["relationship_role"],
      });
    }
  });
}

export type CharacterRelationshipInput = z.infer<
  typeof characterRelationshipSchema
>;

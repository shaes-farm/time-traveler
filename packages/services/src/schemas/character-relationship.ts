import { z } from "zod";
import { temporalDataSchema, compareTemporal } from "./temporal";

// NOTE: The relationship types below match the DB CHECK constraint. The
// original 11 interpersonal types are defined in
// supabase/migrations/00002_relationships_junctions.sql; the 21 causal /
// derivational / attitudinal types are added in
// supabase/migrations/00029_extend_relationship_types.sql. The schema governs.
// Issue #32's earlier 16-type list is superseded by this 32-type vocabulary;
// see docs/adr/adr-0037-extend-relationship-vocabulary.md for the reconciliation.
export const relationshipTypeEnum = z.enum([
  // Original 11 (00002) — interpersonal/social.
  "family",
  "professional",
  "friendship",
  "rivalry",
  "owner_pet",
  "trainer_trainee",
  "creator_creation",
  "worship",
  "collaboration",
  "enemy",
  "mentor_student",
  // Added in 00029 (ADR-0037) — causal / derivational / attitudinal.
  "observed",
  "influenced",
  "improved",
  "standardized",
  "enabled",
  "superseded",
  "derived_from",
  "challenged",
  "inspired",
  "succeeded",
  "contradicted",
  "copied",
  "predicted",
  "calculated",
  "measured",
  "named",
  "patented",
  "adopted",
  "rejected",
  "forgotten",
  "rediscovered",
]);

// Sub-role taxonomy per issue #119 (see also
// docs/design/admin/02-wireframes/06-relationships-editor.md). Only three of
// the eleven relationship_type values accept a sub-role; the other eight
// must have relationship_role = NULL.
export const familyRoleEnum = z.enum([
  "spouse",
  "parent",
  "child",
  "sibling",
  "grandparent",
  "grandchild",
  "aunt_uncle",
  "niece_nephew",
  "cousin",
  "in_law",
  "step_parent",
  "step_child",
  "step_sibling",
  "adoptive_parent",
  "adoptive_child",
  "other",
]);

export const professionalRoleEnum = z.enum([
  "employer",
  "employee",
  "colleague",
  "supervisor",
  "subordinate",
  "business_partner",
  "client",
  "vendor",
  "other",
]);

export const collaborationRoleEnum = z.enum([
  "co_author",
  "co_founder",
  "research_partner",
  "performance_partner",
  "band_member",
  "creative_partner",
  "other",
]);

/**
 * Returns true if `relationship_type` accepts a `relationship_role` sub-role.
 * The three sub-roled types are: family, professional, collaboration.
 */
export function typeAcceptsRole(
  type: z.infer<typeof relationshipTypeEnum>,
): boolean {
  return (
    type === "family" || type === "professional" || type === "collaboration"
  );
}

/**
 * Validates a (type, role) pair. Returns null if valid, or a human-readable
 * error message describing the mismatch. NULL role is always valid.
 */
export function validateTypeRoleCombination(
  type: z.infer<typeof relationshipTypeEnum>,
  role: string | null | undefined,
): string | null {
  if (role === null || role === undefined) {
    return null;
  }
  if (type === "family") {
    return familyRoleEnum.safeParse(role).success
      ? null
      : `relationship_role "${role}" is not a valid family sub-role`;
  }
  if (type === "professional") {
    return professionalRoleEnum.safeParse(role).success
      ? null
      : `relationship_role "${role}" is not a valid professional sub-role`;
  }
  if (type === "collaboration") {
    return collaborationRoleEnum.safeParse(role).success
      ? null
      : `relationship_role "${role}" is not a valid collaboration sub-role`;
  }
  return `relationship_role must be null for relationship_type "${type}"`;
}

// NOTE: Issue #32 references an `is_bidirectional` column. That column does
// not exist in the actual schema. Directionality is implicit in column
// position (character_id vs related_character_id) and is handled in query
// logic via OR filters.
// DECISION NEEDED: determine whether an is_bidirectional column should be
// added via a future migration, or whether the current implicit model is
// intentional.
// Base object schema without cross-field refinements — needed separately
// because Zod v4 does not support .pick() or .partial() on refined schemas.
// Use characterRelationshipBaseSchema when you need to derive a sub-schema;
// use characterRelationshipSchema for full validation including temporal ordering.
export const characterRelationshipBaseSchema = z.object({
  character_id: z.string().uuid(),
  related_character_id: z.string().uuid(),
  relationship_type: relationshipTypeEnum,
  relationship_role: z.string().nullable().optional(),
  description: z.string().optional(),
  start_temporal: temporalDataSchema.optional(),
  end_temporal: temporalDataSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const characterRelationshipSchema =
  characterRelationshipBaseSchema.superRefine((data, ctx) => {
    // Enforce temporal ordering when both bounds are provided.
    // The DB has no CHECK constraint for this, so validation lives here.
    if (data.start_temporal !== undefined && data.end_temporal !== undefined) {
      if (compareTemporal(data.start_temporal, data.end_temporal) > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "start_temporal must not be later than end_temporal",
          path: ["end_temporal"],
        });
      }
    }
    // Enforce type/role consistency. Mirrors the DB CHECK constraints from
    // migration 00014; validates early so the editor gets typed errors before
    // hitting PostgREST.
    const roleError = validateTypeRoleCombination(
      data.relationship_type,
      data.relationship_role,
    );
    if (roleError !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: roleError,
        path: ["relationship_role"],
      });
    }
  });

export type CharacterRelationshipInput = z.infer<
  typeof characterRelationshipSchema
>;

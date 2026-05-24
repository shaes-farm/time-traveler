import { z } from "zod";
import { temporalDataSchema, compareTemporal } from "./temporal.js";

// NOTE: The relationship types below match the DB CHECK constraint in
// supabase/migrations/00002_relationships_junctions.sql. Issue #32 lists a
// different set of 16 types; the schema governs. See:
// DECISION NEEDED: reconcile issue #32 relationship_type list with the DB
// CHECK constraint values before adding new types.
export const relationshipTypeEnum = z.enum([
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
]);

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
  });

export type CharacterRelationshipInput = z.infer<
  typeof characterRelationshipSchema
>;

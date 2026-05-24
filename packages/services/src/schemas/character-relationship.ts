import { z } from "zod";
import { temporalDataSchema } from "./temporal.js";

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
export const characterRelationshipSchema = z.object({
  character_id: z.string().uuid(),
  related_character_id: z.string().uuid(),
  relationship_type: relationshipTypeEnum,
  description: z.string().optional(),
  start_temporal: temporalDataSchema.optional(),
  end_temporal: temporalDataSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CharacterRelationshipInput = z.infer<
  typeof characterRelationshipSchema
>;

import { z } from "zod";
import { slugSchema } from "./slug.js";
import { temporalDataSchema } from "./temporal.js";

export const characterTypeEnum = z.enum([
  "human",
  "animal",
  "mythological",
  "fictional",
  "organization",
  "divine",
  "artifact",
]);

export const significanceEnum = z.enum(["low", "medium", "high", "critical"]);

export const characterSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(2000),
  character_type: characterTypeEnum,
  biography: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  cultural_context: z.array(z.string()).optional(),
  physical_description: z.string().optional(),
  species: z.string().max(500).optional(),
  breed: z.string().max(500).optional(),
  domain: z.string().max(500).optional(),
  significance: significanceEnum.default("medium"),
  birth_temporal: temporalDataSchema.optional(),
  death_temporal: temporalDataSchema.optional(),
  profile_data: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CharacterInput = z.infer<typeof characterSchema>;

// ---------------------------------------------------------------------------
// Per-type profile_data schemas (strict validation by character_type)
// ---------------------------------------------------------------------------

/**
 * Human: biographical details — nationality, occupation, optional
 * birth/death temporal overrides (in addition to the top-level fields).
 */
export const humanProfileSchema = z.object({
  character_type: z.literal("human"),
  nationality: z.string().max(500).optional(),
  occupation: z.string().max(500).optional(),
});

/**
 * Animal: species classification and conservation status.
 * `species` and `habitat` are stored on the top-level row, but
 * `conservation_status` lives in profile_data.
 */
export const animalProfileSchema = z.object({
  character_type: z.literal("animal"),
  conservation_status: z
    .enum([
      "extinct",
      "extinct_in_wild",
      "critically_endangered",
      "endangered",
      "vulnerable",
      "near_threatened",
      "least_concern",
      "data_deficient",
      "not_evaluated",
    ])
    .optional(),
});

/**
 * Mythological: mythology of origin, domain(s), and supernatural powers.
 */
export const mythologicalProfileSchema = z.object({
  character_type: z.literal("mythological"),
  mythology: z.string().max(500).optional(),
  powers: z.array(z.string()).optional(),
});

/**
 * Fictional: source work, author, and genre.
 */
export const fictionalProfileSchema = z.object({
  character_type: z.literal("fictional"),
  source_work: z.string().max(1000).optional(),
  author: z.string().max(500).optional(),
  genre: z.string().max(500).optional(),
});

/**
 * Organization: organisation type and headquarters location.
 */
export const organizationProfileSchema = z.object({
  character_type: z.literal("organization"),
  org_type: z.string().max(500).optional(),
  headquarters: z.string().max(500).optional(),
});

/**
 * Divine: pantheon, domain (shared top-level field), and worship period.
 */
export const divineProfileSchema = z.object({
  character_type: z.literal("divine"),
  pantheon: z.string().max(500).optional(),
  worship_period: z.string().max(500).optional(),
});

/**
 * Artifact: physical type of object, material composition, and current
 * physical location.
 */
export const artifactProfileSchema = z.object({
  character_type: z.literal("artifact"),
  artifact_type: z.string().max(500).optional(),
  material: z.string().max(500).optional(),
  current_location: z.string().max(1000).optional(),
});

/**
 * Discriminated union that selects the correct profile schema based on
 * `character_type`. Use this to validate `profile_data` alongside the
 * `character_type` field at create/update time.
 */
export const characterTypeProfileSchema = z.discriminatedUnion(
  "character_type",
  [
    humanProfileSchema,
    animalProfileSchema,
    mythologicalProfileSchema,
    fictionalProfileSchema,
    organizationProfileSchema,
    divineProfileSchema,
    artifactProfileSchema,
  ],
);

export type CharacterTypeProfile = z.infer<typeof characterTypeProfileSchema>;

/**
 * Input for createCharacter — slug is derived from name automatically.
 * Uses the Zod *input* type so that fields with schema defaults (significance)
 * are optional for callers.
 */
export type CreateCharacterInput = Omit<
  z.input<typeof characterSchema>,
  "slug"
> & {
  slug?: string;
};

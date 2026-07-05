import { z } from "zod";
import { slugSchema } from "./slug";
import { temporalDataSchema } from "./temporal";

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

/**
 * Top-level shape of a character row.
 *
 * Column vs profile_data split (see migration 00001 and the per-type profile
 * schemas below):
 * - `species`, `breed`, `domain` are top-level `VARCHAR(500)` COLUMNS on the
 *   character row, NOT `profile_data` keys. `species`/`breed` apply to
 *   `animal`; `domain` is shared by `mythological`/`divine`.
 * - `birth_temporal`/`death_temporal` are top-level JSONB columns and must
 *   never be duplicated inside `profile_data`.
 * - All other type-specific extras (`conservation_status`, `pantheon`,
 *   `worship_period`, `powers`, `mythology`, `source_work`, `author`, `genre`,
 *   `org_type`, `headquarters`, `artifact_type`, `material`,
 *   `current_location`, `nationality`, `occupation`) live in `profile_data`
 *   and are validated by `characterTypeProfileSchema`.
 *
 * Note: `species` is `.optional()` here because this schema is shared with
 * `.partial()` updates. The "species required when character_type = 'animal'"
 * invariant is enforced in the service layer (character-service.ts), which can
 * resolve the effective type/species across a partial patch and the stored row.
 */
export const characterSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(2000),
  character_type: characterTypeEnum,
  biography: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  cultural_context: z.array(z.string()).optional(),
  physical_description: z.string().optional(),
  // Top-level columns (not profile_data). species/breed → animal; see service
  // for the animal-species-required guard.
  species: z.string().max(500).optional(),
  breed: z.string().max(500).optional(),
  // Top-level column shared by mythological/divine.
  domain: z.string().max(500).optional(),
  significance: significanceEnum.default("medium"),
  // Nullable so an editor can clear an existing date on update: a partial patch
  // sending `null` writes SQL NULL to the column (the DB column is nullable
  // JSONB). Omitting the field (undefined) leaves the stored value untouched.
  birth_temporal: temporalDataSchema.nullish(),
  death_temporal: temporalDataSchema.nullish(),
  // Per-type extras; validated by characterTypeProfileSchema, never top-level.
  profile_data: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CharacterInput = z.infer<typeof characterSchema>;

// ---------------------------------------------------------------------------
// Per-type profile_data schemas (strict validation by character_type)
// ---------------------------------------------------------------------------

/**
 * Human: biographical details — nationality and occupation.
 * Birth and death dates are stored in the top-level `birth_temporal` /
 * `death_temporal` columns and are NOT repeated here.
 */
export const humanProfileSchema = z
  .object({
    character_type: z.literal("human"),
    nationality: z.string().max(500).optional(),
    occupation: z.string().max(500).optional(),
  })
  .strict();

/**
 * Animal: species classification and conservation status.
 * `species` and `breed` are stored on the top-level character row;
 * `conservation_status` lives in profile_data.
 */
export const animalProfileSchema = z
  .object({
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
  })
  .strict();

/**
 * Mythological: mythology of origin, domain(s), and supernatural powers.
 */
export const mythologicalProfileSchema = z
  .object({
    character_type: z.literal("mythological"),
    mythology: z.string().max(500).optional(),
    powers: z.array(z.string()).optional(),
  })
  .strict();

/**
 * Fictional: source work, author, and genre.
 */
export const fictionalProfileSchema = z
  .object({
    character_type: z.literal("fictional"),
    source_work: z.string().max(1000).optional(),
    author: z.string().max(500).optional(),
    genre: z.string().max(500).optional(),
  })
  .strict();

/**
 * Organization: organisation type and headquarters location.
 */
export const organizationProfileSchema = z
  .object({
    character_type: z.literal("organization"),
    org_type: z.string().max(500).optional(),
    headquarters: z.string().max(500).optional(),
  })
  .strict();

/**
 * Divine: pantheon, domain (shared top-level field), and worship period.
 */
export const divineProfileSchema = z
  .object({
    character_type: z.literal("divine"),
    pantheon: z.string().max(500).optional(),
    worship_period: z.string().max(500).optional(),
  })
  .strict();

/**
 * Artifact: physical type of object, material composition, and current
 * physical location.
 */
export const artifactProfileSchema = z
  .object({
    character_type: z.literal("artifact"),
    artifact_type: z.string().max(500).optional(),
    material: z.string().max(500).optional(),
    current_location: z.string().max(1000).optional(),
  })
  .strict();

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

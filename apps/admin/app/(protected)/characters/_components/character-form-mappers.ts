import { z } from "zod";

import {
  characterTypeEnum,
  significanceEnum,
} from "@repo/services/schemas/character";
import type { CharacterInput } from "@repo/services/schemas/character";
import { slugSchema } from "@repo/services/schemas/slug";
import { temporalDataSchema } from "@repo/services/schemas/temporal";
import type { TemporalData } from "@repo/services/schemas/temporal";
import type {
  CreateCharacterInput,
  CharacterWithRelations,
} from "@repo/services/character-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CharacterType = z.infer<typeof characterTypeEnum>;
export type Significance = z.infer<typeof significanceEnum>;

/**
 * The character editor's working value type. Field names mirror the persisted
 * character row (snake_case) so `zodResolver` validates a shape close to what
 * is stored.
 *
 * Divergences from the service `characterSchema`, all UI-only:
 *  - temporal fields are `null` in the empty state (the schema has them
 *    optional-not-nullable);
 *  - `profile_data` / `metadata` are edited as raw JSON **text** behind the
 *    Advanced disclosure, parsed back to objects on save;
 *  - `pending_primary_media_id` holds a media row chosen in the create flow
 *    before the character (and therefore the `character_media` junction)
 *    exists; it is written after the create succeeds and never persisted as a
 *    column.
 *
 * `published` is captured here but is **not** part of the create/update
 * payload — publication transitions run through the dedicated
 * publish/unpublish service calls (see character-form-client).
 */
export interface CharacterFormValues {
  name: string;
  character_type: CharacterType;
  slug: string;
  biography: string;
  aliases: string[];
  cultural_context: string[];
  physical_description: string;
  species: string;
  breed: string;
  domain: string;
  significance: Significance;
  birth_temporal: TemporalData | null;
  death_temporal: TemporalData | null;
  published: boolean;
  profile_data_json: string;
  metadata_json: string;
  pending_primary_media_id: string | null;
}

// ---------------------------------------------------------------------------
// Validation — purpose-built form schema (does not mutate characterSchema)
// ---------------------------------------------------------------------------

const JSON_FIELDS = ["profile_data_json", "metadata_json"] as const;

/**
 * Returns a friendly error string when `text` is a non-empty value that is not
 * a JSON **object**, otherwise `null`. Empty/whitespace text is treated as
 * "no value" and passes (mapped to `undefined`/`{}` at persist time).
 */
export function jsonObjectError(text: string): string | null {
  const raw = text.trim();
  if (raw.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "Invalid JSON.";
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "Must be a JSON object.";
  }
  return null;
}

/**
 * Form-only schema. The canonical `characterSchema` still runs server-side in
 * `createCharacter`/`updateCharacter`; this validates the editor's own value
 * shape and surfaces the two cross-field rules inline before the round-trip:
 *  - `animal` requires a non-empty `species` (the service enforces the same
 *    invariant; this gives an inline message + focus jump);
 *  - the Advanced JSON editors must hold valid JSON objects.
 */
export const characterFormSchema = z
  .object({
    name: z.string().min(1, "Name is required.").max(2000),
    character_type: characterTypeEnum,
    slug: slugSchema,
    biography: z.string(),
    aliases: z.array(z.string()),
    cultural_context: z.array(z.string()),
    physical_description: z.string(),
    species: z.string().max(500),
    breed: z.string().max(500),
    domain: z.string().max(500),
    significance: significanceEnum,
    birth_temporal: temporalDataSchema.nullable(),
    death_temporal: temporalDataSchema.nullable(),
    published: z.boolean(),
    profile_data_json: z.string(),
    metadata_json: z.string(),
    pending_primary_media_id: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.character_type === "animal" && data.species.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["species"],
        message: "Species is required for animals.",
      });
    }
    for (const field of JSON_FIELDS) {
      const error = jsonObjectError(data[field]);
      if (error !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: error,
        });
      }
    }
  });

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: CharacterFormValues = {
  name: "",
  character_type: "human",
  slug: "",
  biography: "",
  aliases: [],
  cultural_context: [],
  physical_description: "",
  species: "",
  breed: "",
  domain: "",
  significance: "medium",
  birth_temporal: null,
  death_temporal: null,
  published: false,
  profile_data_json: "",
  metadata_json: "",
  pending_primary_media_id: null,
};

/** Coerce stored JSON to TemporalData, treating invalid/empty (`{}`) as null. */
export function toTemporalOrNull(json: unknown): TemporalData | null {
  const result = temporalDataSchema.safeParse(json);
  return result.success ? result.data : null;
}

/**
 * Render a stored JSONB value as pretty-printed text for an editor textarea.
 * Empty objects (the migration-00001 `'{}'` default) and null render as an
 * empty string so the editor doesn't show a meaningless `{}`.
 */
export function jsonToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length === 0
  ) {
    return "";
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Parse an Advanced JSON textarea back to an object. Returns `undefined` for
 * empty text. Assumes the value already passed `characterFormSchema`
 * validation (invalid JSON never reaches here on a real submit), so a parse
 * failure falls back to `undefined` rather than throwing.
 */
export function parseJsonObject(
  text: string,
): Record<string, unknown> | undefined {
  const raw = text.trim();
  if (raw.length === 0) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Unreachable on a validated submit; guarded for direct/mapper callers.
  }
  return undefined;
}

export function mapRowToFormValues(
  row: CharacterWithRelations,
): CharacterFormValues {
  return {
    name: row.name,
    character_type: (row.character_type as CharacterType | null) ?? "human",
    slug: row.slug,
    biography: row.biography ?? "",
    aliases: row.aliases ?? [],
    cultural_context: row.cultural_context ?? [],
    physical_description: row.physical_description ?? "",
    species: row.species ?? "",
    breed: row.breed ?? "",
    domain: row.domain ?? "",
    significance: (row.significance as Significance | null) ?? "medium",
    birth_temporal: toTemporalOrNull(row.birth_temporal),
    death_temporal: toTemporalOrNull(row.death_temporal),
    published: row.published ?? false,
    profile_data_json: jsonToText(row.profile_data),
    metadata_json: jsonToText(row.metadata),
    pending_primary_media_id: null,
  };
}

export function toCreateInput(
  values: CharacterFormValues,
): CreateCharacterInput {
  return {
    name: values.name,
    character_type: values.character_type,
    // The service generates + collision-resolves the slug; only pass a base
    // when the user has typed one, otherwise omit so it derives from the name.
    slug: values.slug || undefined,
    biography: values.biography || undefined,
    aliases: values.aliases.length > 0 ? values.aliases : undefined,
    cultural_context:
      values.cultural_context.length > 0 ? values.cultural_context : undefined,
    physical_description: values.physical_description || undefined,
    species: values.species || undefined,
    breed: values.breed || undefined,
    domain: values.domain || undefined,
    significance: values.significance,
    birth_temporal: values.birth_temporal ?? undefined,
    death_temporal: values.death_temporal ?? undefined,
    profile_data: parseJsonObject(values.profile_data_json),
    metadata: parseJsonObject(values.metadata_json),
  };
}

export function toUpdateData(
  values: CharacterFormValues,
): Partial<CharacterInput> {
  return {
    name: values.name,
    character_type: values.character_type,
    slug: values.slug,
    // Text/array fields are sent as-is (including "") so clearing a field on an
    // existing record actually persists the clear.
    biography: values.biography,
    aliases: values.aliases,
    cultural_context: values.cultural_context,
    physical_description: values.physical_description,
    species: values.species,
    breed: values.breed,
    domain: values.domain,
    significance: values.significance,
    // `null` clears an existing date (the schema/column are nullable); a value
    // sets or updates it. Sent unconditionally so a clear actually persists.
    birth_temporal: values.birth_temporal,
    death_temporal: values.death_temporal,
    // Empty JSON text clears the extras to `{}` rather than omitting (which
    // would leave the stored value untouched).
    profile_data: parseJsonObject(values.profile_data_json) ?? {},
    metadata: parseJsonObject(values.metadata_json) ?? {},
  };
}

/**
 * The curated subset "Save and add another" carries into the next blank form
 * (wireframe 05 annotation #9): type, significance, and cultural context.
 */
export function seedForAddAnother(
  values: CharacterFormValues,
): CharacterFormValues {
  return {
    ...BLANK_VALUES,
    character_type: values.character_type,
    significance: values.significance,
    cultural_context: values.cultural_context,
  };
}

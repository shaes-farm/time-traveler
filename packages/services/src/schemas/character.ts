import { z } from "zod";
import { temporalDataSchema } from "./temporal.js";

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens");

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

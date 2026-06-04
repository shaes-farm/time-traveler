import { z } from "zod";
import { slugSchema } from "./slug";
import { temporalDataSchema } from "./temporal";

export const timelineTypeEnum = z.enum([
  "general",
  "biographical",
  "comparative",
]);

export const timelineVisibilityEnum = z.enum(["private", "public", "shared"]);

export const timelineSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  summary: z.string().optional(),
  detail: z.string().optional(),
  scale: z.string().max(2000).optional(),
  temporal_data: temporalDataSchema,
  end_temporal_data: temporalDataSchema.nullable().optional(),
  timeline_type: timelineTypeEnum.default("general"),
  subject_character_id: z.string().uuid().nullable().optional(),
  visibility: timelineVisibilityEnum.default("private"),
  fractal_depth: z.number().int().min(1).default(5),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TimelineInput = z.infer<typeof timelineSchema>;

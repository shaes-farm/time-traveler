import { z } from "zod";
import { slugSchema } from "./slug.js";
import { temporalDataSchema } from "./temporal.js";

export const eventTypeEnum = z.enum([
  "milestone",
  "period",
  "incident",
  "discovery",
  "creation",
  "destruction",
  "transformation",
  "migration",
  "conflict",
  "ceremony",
]);

export const eventSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  summary: z.string().optional(),
  detail: z.string().optional(),
  event_type: eventTypeEnum.default("milestone"),
  temporal_data: temporalDataSchema,
  end_temporal_data: temporalDataSchema.optional(),
  location: z.string().max(2000).optional(),
  spatial_data: z.record(z.string(), z.unknown()).optional(),
  importance: z.number().int().min(1).max(10).default(5),
  parent_event_id: z.string().uuid().optional(),
  timeline_id: z.string().uuid().optional(),
  detail_timeline_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

import { z } from "zod";
import { slugSchema } from "./slug";
import { temporalDataSchema } from "./temporal";

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
  end_temporal_data: temporalDataSchema.nullable().optional(),
  location: z.string().max(2000).optional(),
  spatial_data: z.record(z.string(), z.unknown()).optional(),
  importance: z.number().int().min(1).max(10).default(5),
  // Fractal nesting is forward-only via detail_timeline_id (#177); the backward
  // event-to-event parent_event_id field is retired (#180).
  // Both fields are nullable — null explicitly clears the association (e.g. unlinking a home event).
  timeline_id: z.string().uuid().nullish(),
  detail_timeline_id: z.string().uuid().nullish(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

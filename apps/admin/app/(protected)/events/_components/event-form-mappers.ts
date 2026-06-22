import { z } from "zod";

import { eventSchema, eventTypeEnum } from "@repo/services/schemas/event";
import type { EventInput } from "@repo/services/schemas/event";
import type {
  CreateEventInput,
  EventWithRelations,
} from "@repo/services/event-service";
import {
  temporalDataSchema,
  compareTemporal,
} from "@repo/services/schemas/temporal";
import type { TemporalData } from "@repo/services/schemas/temporal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = z.infer<typeof eventTypeEnum>;

/**
 * The form's working value type. Uses the schema's snake_case field names so
 * `zodResolver` validates directly. Two shape differences from the persisted
 * `eventSchema`:
 *  - `temporal_data` is nullable here (the empty UI state); the required check
 *    lives in `eventFormSchema` below for a clean message.
 *  - `spatial_data` (a lat/lng JSONB blob) is split into two scalar
 *    `latitude`/`longitude` inputs and recombined on persist.
 *  - `appears_in` holds the "also appears in" timeline ids (the `timeline_events`
 *    junction), reconciled separately from the event row write.
 *
 * Publication is intentionally NOT editable here, mirroring the timeline editor:
 * the editor only writes draft content. Publish/unpublish is a separate control
 * (event detail + the publish workflow, #48).
 */
export interface EventFormValues {
  title: string;
  slug: string;
  summary: string;
  detail: string;
  event_type: EventType;
  importance: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  temporal_data: TemporalData | null;
  end_temporal_data: TemporalData | null;
  timeline_id: string | undefined;
  appears_in: string[];
  detail_timeline_id: string | undefined;
  metadata: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Validation — wrap the canonical schema (do not mutate it)
// ---------------------------------------------------------------------------

/**
 * Form-only schema: reuses `eventSchema` for every field, but
 *  - drops `spatial_data` in favour of scalar `latitude`/`longitude`;
 *  - makes the temporal fields nullable (the empty UI state), then requires a
 *    start via superRefine with a friendly message;
 *  - adds the "also appears in" id list;
 *  - enforces the cross-field rules from #46: end-not-before-start (hard error),
 *    expands-into ≠ primary timeline, and coordinates supplied as a pair.
 * These refinements are validation-only and never reach the service.
 */
export const eventFormSchema = eventSchema
  .omit({ spatial_data: true })
  .extend({
    temporal_data: temporalDataSchema.nullable(),
    end_temporal_data: temporalDataSchema.nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    appears_in: z.array(z.string().uuid()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.temporal_data === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["temporal_data"],
        message: "A start date is required.",
      });
    }
    if (
      data.temporal_data &&
      data.end_temporal_data &&
      compareTemporal(data.end_temporal_data, data.temporal_data) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_temporal_data"],
        message: "End must be the same as or later than the start.",
      });
    }
    if (
      data.detail_timeline_id &&
      data.timeline_id &&
      data.detail_timeline_id === data.timeline_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["detail_timeline_id"],
        message: "An event can't expand into its own primary timeline.",
      });
    }
    const hasLat = data.latitude != null;
    const hasLng = data.longitude != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLat ? "longitude" : "latitude"],
        message: "Latitude and longitude must be provided together.",
      });
    }
  });

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: EventFormValues = {
  title: "",
  slug: "",
  summary: "",
  detail: "",
  event_type: "milestone",
  importance: 5,
  location: "",
  latitude: null,
  longitude: null,
  temporal_data: null,
  end_temporal_data: null,
  timeline_id: undefined,
  appears_in: [],
  detail_timeline_id: undefined,
  metadata: undefined,
};

/** Coerce stored JSON to TemporalData, treating invalid/empty (`{}`) as null. */
export function toTemporalOrNull(json: unknown): TemporalData | null {
  const result = temporalDataSchema.safeParse(json);
  return result.success ? result.data : null;
}

/**
 * Maps a number-input's value to a nullable number. Treats both an empty field
 * and unparseable input (e.g. a lone "-" or "1.2.3", which yield NaN from
 * `valueAsNumber`) as null, so the user never sees a raw "received nan" error.
 */
export function parseNullableNumber(
  raw: string,
  parsed: number,
): number | null {
  if (raw === "" || Number.isNaN(parsed)) return null;
  return parsed;
}

/** Read a numeric coordinate out of the stored `spatial_data` JSONB. */
export function readCoordinate(
  spatial: unknown,
  key: "lat" | "lng",
): number | null {
  if (spatial && typeof spatial === "object" && !Array.isArray(spatial)) {
    const value = (spatial as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  return null;
}

/** Recombine the two scalar inputs back into a `spatial_data` blob. */
export function toSpatialData(
  latitude: number | null,
  longitude: number | null,
): Record<string, number> | undefined {
  if (latitude == null || longitude == null) return undefined;
  return { lat: latitude, lng: longitude };
}

export function mapRowToFormValues(
  row: EventWithRelations,
  appearsIn: string[],
): EventFormValues {
  return {
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    detail: row.detail ?? "",
    event_type: (row.event_type as EventType | null) ?? "milestone",
    importance: row.importance ?? 5,
    location: row.location ?? "",
    latitude: readCoordinate(row.spatial_data, "lat"),
    longitude: readCoordinate(row.spatial_data, "lng"),
    // Legacy rows may still contain '{}' JSON from migration defaults; treat
    // anything that isn't real TemporalData as null so the editor doesn't render
    // a garbage "undefined …" value.
    temporal_data: toTemporalOrNull(row.temporal_data),
    end_temporal_data: toTemporalOrNull(row.end_temporal_data),
    timeline_id: row.timeline_id ?? undefined,
    appears_in: appearsIn,
    detail_timeline_id: row.detail_timeline_id ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

/** Drops empty-string optionals so we never persist "" for nullable text. */
function toPersistedFields(values: EventFormValues) {
  return {
    title: values.title,
    summary: values.summary || undefined,
    detail: values.detail || undefined,
    event_type: values.event_type,
    importance: values.importance,
    location: values.location || undefined,
    temporal_data: values.temporal_data as TemporalData,
    end_temporal_data: values.end_temporal_data ?? null,
    timeline_id: values.timeline_id ?? null,
    detail_timeline_id: values.detail_timeline_id ?? null,
    metadata: values.metadata,
  };
}

export function toCreateInput(values: EventFormValues): CreateEventInput {
  return {
    ...toPersistedFields(values),
    spatial_data: toSpatialData(values.latitude, values.longitude),
    slug: values.slug || undefined,
  };
}

export function toUpdateData(values: EventFormValues): Partial<EventInput> {
  return {
    ...toPersistedFields(values),
    // On update an empty `{}` clears any previously stored coordinates, whereas
    // `undefined` would leave them untouched.
    spatial_data: toSpatialData(values.latitude, values.longitude) ?? {},
    slug: values.slug,
  };
}

/** Computes the timeline_events junction membership diff for an edit save. */
export function diffAppearsIn(
  initial: string[],
  next: string[],
): { toAdd: string[]; toRemove: string[] } {
  const initialSet = new Set(initial);
  const nextSet = new Set(next);
  return {
    toAdd: next.filter((id) => !initialSet.has(id)),
    toRemove: initial.filter((id) => !nextSet.has(id)),
  };
}

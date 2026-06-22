import { z } from "zod";

import {
  timelineSchema,
  timelineTypeEnum,
  timelineVisibilityEnum,
} from "@repo/services/schemas/timeline";
import type { TimelineInput } from "@repo/services/schemas/timeline";
import type {
  CreateTimelineInput,
  TimelineWithRelations,
} from "@repo/services/timeline-service";
import {
  temporalDataSchema,
  compareTemporal,
} from "@repo/services/schemas/temporal";
import type { TemporalData } from "@repo/services/schemas/temporal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineType = z.infer<typeof timelineTypeEnum>;
type Visibility = z.infer<typeof timelineVisibilityEnum>;

/**
 * The form's working value type. Uses the schema's snake_case field names so
 * `zodResolver` validates directly. Temporal fields are nullable here (the
 * empty state) even though the persisted schema requires a start — the
 * required check lives in `timelineFormSchema` below for a clean message.
 *
 * Publication (`published`/`published_at`) is intentionally NOT editable here.
 * A timeline isn't publishable until it has linked events, and event-linking
 * plus the publish control both live on the detail page (#44). The editor only
 * ever writes draft content; new timelines are always created as drafts and
 * editing never changes an existing row's live state.
 */
export interface TimelineFormValues {
  title: string;
  slug: string;
  summary: string;
  detail: string;
  scale: string;
  temporal_data: TemporalData | null;
  end_temporal_data: TemporalData | null;
  timeline_type: TimelineType;
  subject_character_id: string | undefined;
  visibility: Visibility;
  fractal_depth: number;
  metadata: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Validation — wrap the canonical schema (do not mutate it)
// ---------------------------------------------------------------------------

/**
 * Form-only schema: reuses `timelineSchema` for every field, but
 *  - makes the temporal fields nullable (the empty UI state), then requires a
 *    start via superRefine with a friendly message;
 *  - enforces the two cross-field rules from issue #43:
 *    biographical-requires-subject and end-not-before-start.
 * These refinements are validation-only and never reach the service.
 */
export const timelineFormSchema = timelineSchema
  .extend({
    temporal_data: temporalDataSchema.nullable(),
    end_temporal_data: temporalDataSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.temporal_data === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["temporal_data"],
        message: "A start date is required.",
      });
    }
    if (data.timeline_type === "biographical" && !data.subject_character_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject_character_id"],
        message: "Biographical timelines require a subject character.",
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
  });

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: TimelineFormValues = {
  title: "",
  slug: "",
  summary: "",
  detail: "",
  scale: "",
  temporal_data: null,
  end_temporal_data: null,
  timeline_type: "general",
  subject_character_id: undefined,
  visibility: "private",
  fractal_depth: 5,
  metadata: undefined,
};

/** Coerce stored JSON to TemporalData, treating invalid/empty (`{}`) as null. */
export function toTemporalOrNull(json: unknown): TemporalData | null {
  const result = temporalDataSchema.safeParse(json);
  return result.success ? result.data : null;
}

export function mapRowToFormValues(
  row: TimelineWithRelations,
): TimelineFormValues {
  return {
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    detail: row.detail ?? "",
    scale: row.scale ?? "",
    // Legacy rows may still contain '{}' JSON from migration 00001 defaults.
    // Validate the JSON and treat anything that isn't a real TemporalData as
    // null, so the editor doesn't render a garbage "undefined …" value.
    temporal_data: toTemporalOrNull(row.temporal_data),
    end_temporal_data: toTemporalOrNull(row.end_temporal_data),
    timeline_type: (row.timeline_type as TimelineType | null) ?? "general",
    subject_character_id: row.subject_character_id ?? undefined,
    visibility: (row.visibility as Visibility | null) ?? "private",
    fractal_depth: row.fractal_depth ?? 5,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

/** Drops empty-string optionals so we never persist "" for nullable text. */
function toPersistedFields(values: TimelineFormValues) {
  return {
    title: values.title,
    summary: values.summary || undefined,
    detail: values.detail || undefined,
    scale: values.scale || undefined,
    temporal_data: values.temporal_data as TemporalData,
    end_temporal_data: values.end_temporal_data ?? null,
    timeline_type: values.timeline_type,
    subject_character_id: values.subject_character_id || undefined,
    visibility: values.visibility,
    fractal_depth: values.fractal_depth,
    metadata: values.metadata,
  };
}

export function toCreateInput(values: TimelineFormValues): CreateTimelineInput {
  return {
    ...toPersistedFields(values),
    slug: values.slug || undefined,
  };
}

export function toUpdateData(
  values: TimelineFormValues,
): Partial<TimelineInput> {
  return {
    ...toPersistedFields(values),
    subject_character_id: values.subject_character_id ?? null,
    slug: values.slug,
  };
}

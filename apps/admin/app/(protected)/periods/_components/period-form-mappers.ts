import { z } from "zod";

import { slugSchema } from "@repo/services/schemas/slug";
import { significanceEnum } from "@repo/services/schemas/character";
import {
  temporalDataSchema,
  compareTemporal,
} from "@repo/services/schemas/temporal";
import type { TemporalData } from "@repo/services/schemas/temporal";
import type { PeriodInput } from "@repo/services/schemas/period";
import type {
  CreatePeriodInput,
  PeriodWithRelations,
} from "@repo/services/period-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Significance = z.infer<typeof significanceEnum>;

/**
 * The period editor's working value type. Field names mirror the persisted
 * `periods` row (snake_case) so `zodResolver` validates a shape close to what
 * is stored.
 *
 * `published` is intentionally absent — the editor is draft-only; publication
 * runs through the dedicated publish/unpublish calls on the detail page
 * (wireframe 16 + 22 annotation #6).
 */
export interface PeriodFormValues {
  title: string;
  slug: string;
  summary: string;
  detail: string;
  /** Start of the span — required at submit, but nullable while editing. */
  temporal_data: TemporalData | null;
  /** End of the span — open-ended (null) is allowed. */
  end_temporal_data: TemporalData | null;
  parent_period_id: string | null;
  significance: Significance;
  characteristics: string[];
}

// ---------------------------------------------------------------------------
// Validation — form-only schema (mirrors periodSchema's span rule)
// ---------------------------------------------------------------------------

/**
 * Form-only schema. The canonical `periodSchema` still runs server-side in
 * `createPeriod`/`updatePeriod`; this validates the editor's own value shape and
 * surfaces two rules inline before the round-trip: the start of the span is
 * required, and the end must not precede the start.
 */
export const periodFormSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(2000),
    slug: slugSchema,
    summary: z.string(),
    detail: z.string(),
    temporal_data: temporalDataSchema.nullable(),
    end_temporal_data: temporalDataSchema.nullable(),
    parent_period_id: z.string().uuid().nullable(),
    significance: significanceEnum,
    characteristics: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.temporal_data === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["temporal_data"],
        message: "A start date is required.",
      });
      return;
    }
    if (
      data.end_temporal_data !== null &&
      compareTemporal(data.temporal_data, data.end_temporal_data) > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_temporal_data"],
        message: "End must be the same as or later than start.",
      });
    }
  });

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: PeriodFormValues = {
  title: "",
  slug: "",
  summary: "",
  detail: "",
  temporal_data: null,
  end_temporal_data: null,
  parent_period_id: null,
  significance: "medium",
  characteristics: [],
};

export function mapRowToFormValues(row: PeriodWithRelations): PeriodFormValues {
  return {
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    detail: row.detail ?? "",
    temporal_data: (row.temporal_data as TemporalData | null) ?? null,
    end_temporal_data: (row.end_temporal_data as TemporalData | null) ?? null,
    parent_period_id: row.parent_period_id,
    significance: (row.significance as Significance | null) ?? "medium",
    characteristics: row.characteristics ?? [],
  };
}

export function toCreateInput(values: PeriodFormValues): CreatePeriodInput {
  if (values.temporal_data === null) {
    // Guarded by periodFormSchema; this keeps the type honest.
    throw new Error("A period requires a start date.");
  }
  return {
    title: values.title,
    // The service generates + collision-resolves the slug; only pass a base
    // when the user has typed one, otherwise omit so it derives from the title.
    slug: values.slug || undefined,
    summary: values.summary || undefined,
    detail: values.detail || undefined,
    temporal_data: values.temporal_data,
    end_temporal_data: values.end_temporal_data,
    parent_period_id: values.parent_period_id ?? undefined,
    significance: values.significance,
    characteristics:
      values.characteristics.length > 0 ? values.characteristics : undefined,
  };
}

export function toUpdateData(values: PeriodFormValues): Partial<PeriodInput> {
  return {
    title: values.title,
    slug: values.slug,
    // Text fields are sent as-is (including "") so clearing a field on an
    // existing record actually persists the clear.
    summary: values.summary,
    detail: values.detail,
    ...(values.temporal_data !== null
      ? { temporal_data: values.temporal_data }
      : {}),
    end_temporal_data: values.end_temporal_data,
    parent_period_id: values.parent_period_id,
    significance: values.significance,
    characteristics: values.characteristics,
  };
}

/**
 * "Save and add another" carries the significance and parent forward into the
 * next blank form — an author entering a run of sibling sub-periods (Triassic,
 * Jurassic, Cretaceous) keeps the shared parent + importance, retypes the rest.
 */
export function seedForAddAnother(values: PeriodFormValues): PeriodFormValues {
  return {
    ...BLANK_VALUES,
    significance: values.significance,
    parent_period_id: values.parent_period_id,
  };
}

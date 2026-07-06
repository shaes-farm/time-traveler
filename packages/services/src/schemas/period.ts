import { z } from "zod";
import type { RefinementCtx } from "zod";
import { slugSchema } from "./slug";
import { temporalDataSchema, compareTemporal } from "./temporal";
import type { TemporalData } from "./temporal";
import { significanceEnum } from "./character";

/**
 * Base object shape for a period. Kept unrefined so `.partial()` remains usable
 * for patch updates (`.superRefine` returns a ZodEffects that has no
 * `.partial()`). Create/update apply {@link periodSchema}/{@link periodUpdateSchema},
 * which layer the span-validity check on top.
 */
export const periodBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  summary: z.string().optional(),
  detail: z.string().optional(),
  temporal_data: temporalDataSchema,
  end_temporal_data: temporalDataSchema.nullable().optional(),
  // Nullable so an update can reparent a period to root (`null`); optional so a
  // create/patch may omit it. Cycles are prevented in the service layer, not
  // the DB (docs/system-design.md §3.4).
  parent_period_id: z.string().uuid().nullable().optional(),
  significance: significanceEnum.default("medium"),
  characteristics: z.array(z.string()).optional(),
});

/**
 * Span validity: a period's end must not precede its start. Mirrors
 * `temporalRangeSchema` in ./temporal and stays consistent with the DB's
 * `sort_order_start`/`sort_order_end` generated columns. Only runs when both
 * bounds are present, so it is safe on partial updates.
 */
function assertValidSpan(
  data: {
    temporal_data?: TemporalData;
    end_temporal_data?: TemporalData | null;
  },
  ctx: RefinementCtx,
): void {
  const start = data.temporal_data;
  const end = data.end_temporal_data;
  if (start != null && end != null && compareTemporal(start, end) > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["end_temporal_data"],
      message: "end must be the same as or later than start",
    });
  }
}

export const periodSchema = periodBaseSchema.superRefine(assertValidSpan);

/** Partial variant for patch updates, with the span check preserved. */
export const periodUpdateSchema = periodBaseSchema
  .partial()
  .superRefine(assertValidSpan);

export type PeriodInput = z.infer<typeof periodBaseSchema>;

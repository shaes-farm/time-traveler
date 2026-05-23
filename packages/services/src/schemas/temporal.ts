import { z } from "zod";

export const eraEnum = z.enum(["CE", "BCE", "KYA", "MYA", "BYA"]);
export const precisionEnum = z.enum([
  "exact",
  "circa",
  "approximate",
  "estimated",
  "geological",
]);
export const displayFormatEnum = z.enum([
  "standard",
  "scientific",
  "geological",
  "cosmological",
]);
export const confidenceLevelEnum = z.enum(["high", "medium", "low"]);

/**
 * Days in a given month under the proleptic Gregorian calendar.
 *
 * Applied uniformly to CE and BCE. Note that historical dates pre-1582
 * actually used the Julian calendar (and BCE has no year 0 in conventional
 * notation), so leap-year accuracy for BCE / early-CE dates is approximate.
 * We extend Gregorian rules throughout for consistency with the migration's
 * `make_timestamp` expectations and to keep validation deterministic.
 */
function daysInMonth(year: number, month: number): number {
  if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
  if ([4, 6, 9, 11].includes(month)) return 30;
  // month === 2
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 29 : 28;
}

/**
 * Validates the JSONB TemporalData structure per docs/system-design.md §4
 * and docs/prd/PRD-0001-time-traveler-system.md §6.
 *
 * - `year` is constrained to integers (#73 finding #4 — sub-year fractional
 *   precision is meaningless at KYA/MYA/BYA scale and breaks the
 *   sort_order_years BIGINT cast in the migration).
 * - `second` allows fractional values (sub-second precision) via `.lt(60)`.
 * - `uncertainty` allows fractional values (± years).
 * - Optional fields use `.nullish()` so JSONB rows with explicit `null`s
 *   (e.g., PRD §6.2 example: `"cosmological_epoch": null`) are accepted.
 * - Cross-field rules (via .superRefine):
 *     - Prehistoric eras (KYA/MYA/BYA) reject month/day/hour/minute/second
 *     - CE and BCE require year >= 1 (no year 0 in conventional dating)
 *     - Prehistoric eras require year > 0
 *     - CE/BCE: day requires month
 *     - CE/BCE: hour/minute/second require day
 *     - CE/BCE: day must be valid for the month (Feb 30, Apr 31, etc. rejected;
 *       Feb 29 honors leap years)
 */
export const temporalDataSchema = z
  .object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12).nullish(),
    day: z.number().int().min(1).max(31).nullish(),
    hour: z.number().int().min(0).max(23).nullish(),
    minute: z.number().int().min(0).max(59).nullish(),
    second: z.number().min(0).lt(60).nullish(),
    era: eraEnum,
    precision: precisionEnum,
    uncertainty: z.number().nonnegative().nullish(),
    geological_period: z.string().nullish(),
    geological_epoch: z.string().nullish(),
    cosmological_epoch: z.string().nullish(),
    display_format: displayFormatEnum.nullish(),
    dating_method: z.string().nullish(),
    confidence_level: confidenceLevelEnum.nullish(),
    source: z.string().nullish(),
  })
  .superRefine((data, ctx) => {
    const isPrehistoric =
      data.era === "KYA" || data.era === "MYA" || data.era === "BYA";

    if (isPrehistoric) {
      const subYearFields = ["month", "day", "hour", "minute", "second"] as const;
      for (const field of subYearFields) {
        if (data[field] != null) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is not allowed for ${data.era} era — prehistoric eras don't support sub-year precision`,
          });
        }
      }
    }

    if (data.era === "BCE" && data.year < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["year"],
        message:
          "BCE year must be >= 1 — there is no year 0 in the BCE/CE system (1 BCE is immediately followed by 1 CE)",
      });
    }

    if (data.era === "CE" && data.year < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["year"],
        message: "CE year must be >= 1",
      });
    }

    if (isPrehistoric && data.year <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["year"],
        message: `${data.era} year must be a positive integer`,
      });
    }

    if (data.era === "CE" || data.era === "BCE") {
      // day requires month
      if (data.day != null && data.month == null) {
        ctx.addIssue({
          code: "custom",
          path: ["day"],
          message: "day requires month to be specified",
        });
      }

      // hour/minute/second require day
      for (const f of ["hour", "minute", "second"] as const) {
        if (data[f] != null && data.day == null) {
          ctx.addIssue({
            code: "custom",
            path: [f],
            message: `${f} requires day to be specified`,
          });
        }
      }

      // day must be valid for the month (Feb 30, Apr 31, etc.)
      if (data.month != null && data.day != null) {
        const maxDay = daysInMonth(data.year, data.month);
        if (data.day > maxDay) {
          ctx.addIssue({
            code: "custom",
            path: ["day"],
            message:
              data.month === 2
                ? `day ${data.day} is invalid for February (year ${data.year}: ${maxDay} days)`
                : `day ${data.day} is invalid for month ${data.month} (max ${maxDay})`,
          });
        }
      }
    }
  });

export type TemporalData = z.infer<typeof temporalDataSchema>;
export type Era = z.infer<typeof eraEnum>;
export type Precision = z.infer<typeof precisionEnum>;
export type DisplayFormat = z.infer<typeof displayFormatEnum>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelEnum>;

/**
 * Era→sortable conversion mirroring the SQL `sort_order_years` generated
 * column in supabase/migrations/00001_initial_schema.sql. Inlined here (and
 * re-exported from TemporalService) so temporalRangeSchema's start≤end check
 * doesn't introduce a schemas→modules circular import.
 */
function eraToSortableYears(t: Pick<TemporalData, "era" | "year">): number {
  switch (t.era) {
    case "CE":
      return t.year;
    case "BCE":
      return -t.year;
    case "KYA":
      return -t.year * 1_000;
    case "MYA":
      return -t.year * 1_000_000;
    case "BYA":
      return -t.year * 1_000_000_000;
  }
}

export const temporalRangeSchema = z
  .object({
    start: temporalDataSchema,
    end: temporalDataSchema,
  })
  .superRefine((data, ctx) => {
    if (eraToSortableYears(data.start) > eraToSortableYears(data.end)) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "end must be the same as or later than start",
      });
    }
  });

export type TemporalRange = z.infer<typeof temporalRangeSchema>;

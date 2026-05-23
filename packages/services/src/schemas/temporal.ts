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
 * Validates the JSONB TemporalData structure per docs/system-design.md §4.2 / §4.6.
 *
 * - Years are integers (#73 finding #4 — sub-year fractional precision is
 *   meaningless at KYA/MYA/BYA scale and breaks the sort_order_years BIGINT
 *   cast in the migration).
 * - Cross-field rules (via .superRefine):
 *     - Prehistoric eras (KYA/MYA/BYA) reject month/day/hour/minute/second
 *     - CE and BCE require year >= 1 (no year 0 in conventional dating)
 *     - Prehistoric eras require year > 0
 */
export const temporalDataSchema = z
  .object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    second: z.number().int().min(0).max(59).optional(),
    era: eraEnum,
    precision: precisionEnum,
    uncertainty: z.number().int().nonnegative().optional(),
    geological_period: z.string().optional(),
    geological_epoch: z.string().optional(),
    cosmological_epoch: z.string().optional(),
    display_format: displayFormatEnum.optional(),
    dating_method: z.string().optional(),
    confidence_level: confidenceLevelEnum.optional(),
    source: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isPrehistoric =
      data.era === "KYA" || data.era === "MYA" || data.era === "BYA";

    if (isPrehistoric) {
      const subYearFields = ["month", "day", "hour", "minute", "second"] as const;
      for (const field of subYearFields) {
        if (data[field] !== undefined) {
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
  });

export type TemporalData = z.infer<typeof temporalDataSchema>;

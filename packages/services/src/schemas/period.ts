import { z } from "zod";
import { slugSchema } from "./slug";
import { temporalDataSchema } from "./temporal";
import { significanceEnum } from "./character";

export const periodSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  summary: z.string().optional(),
  detail: z.string().optional(),
  temporal_data: temporalDataSchema,
  end_temporal_data: temporalDataSchema.nullable().optional(),
  parent_period_id: z.string().uuid().optional(),
  significance: significanceEnum.default("medium"),
  characteristics: z.array(z.string()).optional(),
});

export type PeriodInput = z.infer<typeof periodSchema>;

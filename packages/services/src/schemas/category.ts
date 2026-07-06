import { z } from "zod";
import { slugSchema } from "./slug";

export const categorySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "color must be a 6-digit hex like #aabbcc")
    .optional(),
  icon: z.string().max(100).optional(),
  // Nullable so an update can reparent a node to root (`null`); optional so a
  // create/patch may omit it. Cycles are prevented in the service layer, not
  // the DB (docs/system-design.md §3.4).
  parent_category_id: z.string().uuid().nullable().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

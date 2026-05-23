import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens");

export const categorySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "color must be a 6-digit hex like #aabbcc")
    .optional(),
  icon: z.string().max(100).optional(),
  parent_category_id: z.string().uuid().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

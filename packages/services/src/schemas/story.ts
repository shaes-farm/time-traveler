import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens");

export const narratorTypeEnum = z.enum([
  "first_person",
  "third_person",
  "omniscient",
]);

export const storySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  sub_title: z.string().max(2000).optional(),
  summary: z.string().optional(),
  detail: z.string().optional(),
  perspective_character_id: z.string().uuid().optional(),
  narrator_type: narratorTypeEnum.optional(),
  tags: z.array(z.string()).optional(),
});

export type StoryInput = z.infer<typeof storySchema>;

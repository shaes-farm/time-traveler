import { z } from "zod";
import { slugSchema } from "./slug";

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

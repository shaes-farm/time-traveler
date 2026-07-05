import { z } from "zod";
import { slugSchema } from "./slug";

export const narratorTypeEnum = z.enum([
  "first_person",
  "third_person",
  "omniscient",
]);

/**
 * Valid values for the `story_characters.role_in_story` column. Mirrors the DB
 * CHECK constraint in `00002_relationships_junctions.sql` and the
 * `StoryCharacterRole` type in `story-service.ts`.
 */
export const storyCharacterRoleEnum = z.enum([
  "protagonist",
  "supporting",
  "mentioned",
  "narrator",
]);

/**
 * The bare story object shape. Kept separate from `storySchema` so `.partial()`
 * (used for updates) stays available — `.superRefine` would wrap it in a
 * `ZodEffects` that has no `.partial()` method.
 */
export const storyBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(2000),
  sub_title: z.string().max(2000).optional(),
  summary: z.string().optional(),
  detail: z.string().optional(),
  perspective_character_id: z.string().uuid().nullable().optional(),
  narrator_type: narratorTypeEnum.optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Full story schema for creates. Enforces the data-contract rule that a
 * first-person narrative must name its perspective character.
 */
export const storySchema = storyBaseSchema.superRefine((value, ctx) => {
  if (
    value.narrator_type === "first_person" &&
    value.perspective_character_id == null
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["perspective_character_id"],
      message:
        "perspective_character_id is required when narrator_type is first_person",
    });
  }
});

export type StoryInput = z.infer<typeof storyBaseSchema>;

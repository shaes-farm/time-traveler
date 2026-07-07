import { z } from "zod";

import { narratorTypeEnum } from "@repo/services/schemas/story";
import { slugSchema } from "@repo/services/schemas/slug";
import type { StoryInput } from "@repo/services/schemas/story";
import type {
  CreateStoryInput,
  StoryWithRelations,
} from "@repo/services/story-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NarratorType = z.infer<typeof narratorTypeEnum>;

/**
 * The story editor's working value type. Field names mirror the persisted
 * `stories` row (snake_case) so `zodResolver` validates a shape close to what
 * is stored.
 *
 * `narrator_type` is always concrete in the form (defaults to `third_person`)
 * even though the column is nullable. `published` is intentionally absent —
 * the editor is draft-only; publication runs through the dedicated
 * publish/unpublish service calls on the detail page (wireframe 16 + 19).
 */
export interface StoryFormValues {
  title: string;
  sub_title: string;
  slug: string;
  summary: string;
  detail: string;
  narrator_type: NarratorType;
  perspective_character_id: string | null;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Validation — purpose-built form schema (mirrors storySchema's cross-field rule)
// ---------------------------------------------------------------------------

/**
 * Form-only schema. The canonical `storySchema` still runs server-side in
 * `createStory`/`updateStory`; this validates the editor's own value shape and
 * surfaces the first-person rule inline before the round-trip: a first-person
 * story must name the perspective character (whose eyes we see through).
 */
export const storyFormSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(2000),
    sub_title: z.string().max(2000),
    slug: slugSchema,
    summary: z.string(),
    detail: z.string(),
    narrator_type: narratorTypeEnum,
    perspective_character_id: z.string().uuid().nullable(),
    tags: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (
      data.narrator_type === "first_person" &&
      data.perspective_character_id === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["perspective_character_id"],
        message:
          "First-person stories need a perspective character (whose eyes).",
      });
    }
  });

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: StoryFormValues = {
  title: "",
  sub_title: "",
  slug: "",
  summary: "",
  detail: "",
  narrator_type: "third_person",
  perspective_character_id: null,
  tags: [],
};

export function mapRowToFormValues(row: StoryWithRelations): StoryFormValues {
  return {
    title: row.title,
    sub_title: row.sub_title ?? "",
    slug: row.slug,
    summary: row.summary ?? "",
    detail: row.detail ?? "",
    narrator_type: (row.narrator_type as NarratorType | null) ?? "third_person",
    perspective_character_id: row.perspective_character_id,
    tags: row.tags ?? [],
  };
}

export function toCreateInput(values: StoryFormValues): CreateStoryInput {
  return {
    title: values.title,
    // The service generates + collision-resolves the slug; only pass a base
    // when the user has typed one, otherwise omit so it derives from the title.
    slug: values.slug || undefined,
    sub_title: values.sub_title || undefined,
    summary: values.summary || undefined,
    detail: values.detail || undefined,
    narrator_type: values.narrator_type,
    perspective_character_id: values.perspective_character_id ?? undefined,
    tags: values.tags.length > 0 ? values.tags : undefined,
  };
}

export function toUpdateData(values: StoryFormValues): Partial<StoryInput> {
  return {
    title: values.title,
    slug: values.slug,
    // Text fields are sent as-is (including "") so clearing a field on an
    // existing record actually persists the clear.
    sub_title: values.sub_title,
    summary: values.summary,
    detail: values.detail,
    // narrator_type is always included, which keeps updateStory's first-person
    // guard satisfied: the form guarantees a first_person story has a non-null
    // perspective, and any non-first-person value authorises clearing it.
    narrator_type: values.narrator_type,
    perspective_character_id: values.perspective_character_id,
    tags: values.tags,
  };
}

/**
 * "Save and add another" carries the narrator voice into the next blank form.
 * A first-person voice is coerced back to third-person so the fresh form is not
 * born invalid (it would otherwise demand a perspective character immediately).
 */
export function seedForAddAnother(values: StoryFormValues): StoryFormValues {
  return {
    ...BLANK_VALUES,
    narrator_type:
      values.narrator_type === "first_person"
        ? "third_person"
        : values.narrator_type,
  };
}

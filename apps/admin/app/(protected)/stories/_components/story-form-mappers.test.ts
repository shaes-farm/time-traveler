import { describe, it, expect } from "vitest";

import type { StoryWithRelations } from "@repo/services/story-service";

import {
  storyFormSchema,
  BLANK_VALUES,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  seedForAddAnother,
  type StoryFormValues,
} from "./story-form-mappers";

function makeValues(overrides: Partial<StoryFormValues> = {}): StoryFormValues {
  return {
    ...BLANK_VALUES,
    title: "The Silmarillion",
    slug: "the-silmarillion",
    ...overrides,
  };
}

function makeRow(
  overrides: Partial<StoryWithRelations> = {},
): StoryWithRelations {
  return {
    id: "story-1",
    user_id: "user-1",
    slug: "the-silmarillion",
    title: "The Silmarillion",
    sub_title: null,
    summary: null,
    detail: null,
    narrator_type: "third_person",
    perspective_character_id: null,
    tags: null,
    published: false,
    published_at: null,
    search_vector: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as StoryWithRelations;
}

describe("storyFormSchema", () => {
  it("accepts a valid third-person story with no perspective character", () => {
    const result = storyFormSchema.safeParse(makeValues());
    expect(result.success).toBe(true);
  });

  it("requires a title", () => {
    const result = storyFormSchema.safeParse(makeValues({ title: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects first-person without a perspective character", () => {
    const result = storyFormSchema.safeParse(
      makeValues({
        narrator_type: "first_person",
        perspective_character_id: null,
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual([
        "perspective_character_id",
      ]);
    }
  });

  it("accepts first-person with a perspective character", () => {
    const result = storyFormSchema.safeParse(
      makeValues({
        narrator_type: "first_person",
        perspective_character_id: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("mapRowToFormValues", () => {
  it("maps nullable columns to editor defaults", () => {
    const values = mapRowToFormValues(makeRow());
    expect(values).toEqual({
      title: "The Silmarillion",
      sub_title: "",
      slug: "the-silmarillion",
      summary: "",
      detail: "",
      narrator_type: "third_person",
      perspective_character_id: null,
      tags: [],
    });
  });

  it("defaults a null narrator_type to third_person", () => {
    const values = mapRowToFormValues(makeRow({ narrator_type: null }));
    expect(values.narrator_type).toBe("third_person");
  });

  it("preserves populated fields", () => {
    const values = mapRowToFormValues(
      makeRow({
        sub_title: "Quenta Silmarillion",
        summary: "The elder days",
        detail: "# Chapter",
        narrator_type: "first_person",
        perspective_character_id: "char-9",
        tags: ["myth", "elves"],
      }),
    );
    expect(values.sub_title).toBe("Quenta Silmarillion");
    expect(values.narrator_type).toBe("first_person");
    expect(values.perspective_character_id).toBe("char-9");
    expect(values.tags).toEqual(["myth", "elves"]);
  });
});

describe("toCreateInput", () => {
  it("omits blank optional fields and an empty slug", () => {
    const input = toCreateInput(makeValues({ slug: "" }));
    expect(input.slug).toBeUndefined();
    expect(input.sub_title).toBeUndefined();
    expect(input.summary).toBeUndefined();
    expect(input.tags).toBeUndefined();
    expect(input.perspective_character_id).toBeUndefined();
    expect(input.title).toBe("The Silmarillion");
    expect(input.narrator_type).toBe("third_person");
  });

  it("passes through populated fields", () => {
    const input = toCreateInput(
      makeValues({
        sub_title: "Sub",
        tags: ["a"],
        narrator_type: "first_person",
        perspective_character_id: "char-1",
      }),
    );
    expect(input.sub_title).toBe("Sub");
    expect(input.tags).toEqual(["a"]);
    expect(input.perspective_character_id).toBe("char-1");
  });
});

describe("toUpdateData", () => {
  it("sends text fields as-is (including empty) so clears persist", () => {
    const data = toUpdateData(makeValues({ sub_title: "", summary: "" }));
    expect(data.sub_title).toBe("");
    expect(data.summary).toBe("");
  });

  it("always includes narrator_type and the perspective value", () => {
    const data = toUpdateData(
      makeValues({
        narrator_type: "omniscient",
        perspective_character_id: null,
      }),
    );
    expect(data.narrator_type).toBe("omniscient");
    expect(data.perspective_character_id).toBeNull();
  });
});

describe("seedForAddAnother", () => {
  it("carries a non-first-person narrator voice into a blank form", () => {
    const seeded = seedForAddAnother(
      makeValues({ narrator_type: "omniscient", tags: ["x"] }),
    );
    expect(seeded.narrator_type).toBe("omniscient");
    expect(seeded.title).toBe("");
    expect(seeded.tags).toEqual([]);
  });

  it("coerces a first-person voice back to third-person so the form stays valid", () => {
    const seeded = seedForAddAnother(
      makeValues({
        narrator_type: "first_person",
        perspective_character_id: "char-1",
      }),
    );
    expect(seeded.narrator_type).toBe("third_person");
    expect(seeded.perspective_character_id).toBeNull();
  });
});

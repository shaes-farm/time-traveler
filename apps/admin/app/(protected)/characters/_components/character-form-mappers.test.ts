import { describe, it, expect } from "vitest";

import type { TemporalData } from "@repo/services/schemas/temporal";
import type { CharacterWithRelations } from "@repo/services/character-service";

import {
  characterFormSchema,
  BLANK_VALUES,
  jsonObjectError,
  jsonToText,
  parseJsonObject,
  toTemporalOrNull,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  seedForAddAnother,
  type CharacterFormValues,
} from "./character-form-mappers";

const BIRTH: TemporalData = {
  year: 1867,
  era: "CE",
  precision: "exact",
  month: 11,
  day: 7,
};

function makeValues(
  overrides: Partial<CharacterFormValues> = {},
): CharacterFormValues {
  return {
    ...BLANK_VALUES,
    name: "Marie Curie",
    slug: "marie-curie",
    ...overrides,
  };
}

describe("jsonObjectError", () => {
  it("passes empty text", () => {
    expect(jsonObjectError("")).toBeNull();
    expect(jsonObjectError("   ")).toBeNull();
  });

  it("passes a JSON object", () => {
    expect(jsonObjectError('{"nationality":"Polish"}')).toBeNull();
  });

  it("rejects invalid JSON", () => {
    expect(jsonObjectError("{not json")).toBe("Invalid JSON.");
  });

  it("rejects non-object JSON (array, scalar)", () => {
    expect(jsonObjectError("[1,2]")).toBe("Must be a JSON object.");
    expect(jsonObjectError('"hi"')).toBe("Must be a JSON object.");
  });
});

describe("jsonToText / parseJsonObject", () => {
  it("renders an empty object and null as empty text", () => {
    expect(jsonToText({})).toBe("");
    expect(jsonToText(null)).toBe("");
    expect(jsonToText(undefined)).toBe("");
  });

  it("pretty-prints a populated object", () => {
    expect(jsonToText({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("round-trips through parseJsonObject", () => {
    const obj = { nationality: "Polish", occupation: "Physicist" };
    expect(parseJsonObject(jsonToText(obj))).toEqual(obj);
  });

  it("parses empty text to undefined", () => {
    expect(parseJsonObject("")).toBeUndefined();
    expect(parseJsonObject("   ")).toBeUndefined();
  });
});

describe("toTemporalOrNull", () => {
  it("passes valid TemporalData through", () => {
    expect(toTemporalOrNull(BIRTH)).toEqual(BIRTH);
  });

  it("coerces empty/garbage JSON to null", () => {
    expect(toTemporalOrNull({})).toBeNull();
    expect(toTemporalOrNull(null)).toBeNull();
  });
});

describe("mapRowToFormValues", () => {
  function makeRow(
    overrides: Partial<CharacterWithRelations> = {},
  ): CharacterWithRelations {
    return {
      name: "Row name",
      slug: "row-name",
      character_type: "human",
      biography: null,
      aliases: null,
      cultural_context: null,
      physical_description: null,
      species: null,
      breed: null,
      domain: null,
      significance: null,
      birth_temporal: null,
      death_temporal: null,
      published: null,
      profile_data: null,
      metadata: null,
      ...overrides,
    } as unknown as CharacterWithRelations;
  }

  it("falls back to sensible defaults for nullable columns", () => {
    expect(mapRowToFormValues(makeRow())).toMatchObject({
      biography: "",
      aliases: [],
      cultural_context: [],
      physical_description: "",
      species: "",
      breed: "",
      domain: "",
      significance: "medium",
      birth_temporal: null,
      death_temporal: null,
      published: false,
      profile_data_json: "",
      metadata_json: "",
    });
  });

  it("carries persisted values through", () => {
    const values = mapRowToFormValues(
      makeRow({
        character_type: "animal",
        species: "Panthera leo",
        breed: null,
        significance: "critical",
        birth_temporal: BIRTH,
        published: true,
        profile_data: { conservation_status: "vulnerable" },
      }),
    );
    expect(values).toMatchObject({
      character_type: "animal",
      species: "Panthera leo",
      significance: "critical",
      birth_temporal: BIRTH,
      published: true,
    });
    expect(values.profile_data_json).toContain("conservation_status");
  });

  it("treats a legacy empty-object temporal as null", () => {
    expect(
      mapRowToFormValues(makeRow({ birth_temporal: {} })).birth_temporal,
    ).toBeNull();
  });
});

describe("toCreateInput", () => {
  it("drops empty-string optionals and omits an unset slug", () => {
    const input = toCreateInput(
      makeValues({ slug: "", biography: "", species: "", breed: "" }),
    );
    expect(input.slug).toBeUndefined();
    expect(input.biography).toBeUndefined();
    expect(input.species).toBeUndefined();
    expect(input.breed).toBeUndefined();
  });

  it("includes a provided slug and species", () => {
    const input = toCreateInput(
      makeValues({ character_type: "animal", species: "Panthera leo" }),
    );
    expect(input.slug).toBe("marie-curie");
    expect(input.species).toBe("Panthera leo");
  });

  it("omits empty arrays and parses the JSON editors", () => {
    const input = toCreateInput(
      makeValues({
        aliases: [],
        cultural_context: ["Polish"],
        profile_data_json: '{"nationality":"Polish"}',
      }),
    );
    expect(input.aliases).toBeUndefined();
    expect(input.cultural_context).toEqual(["Polish"]);
    expect(input.profile_data).toEqual({ nationality: "Polish" });
  });
});

describe("toUpdateData", () => {
  it("sends cleared text/array fields as-is so the clear persists", () => {
    const data = toUpdateData(
      makeValues({ species: "", breed: "", biography: "", aliases: [] }),
    );
    expect(data.species).toBe("");
    expect(data.breed).toBe("");
    expect(data.biography).toBe("");
    expect(data.aliases).toEqual([]);
  });

  it("clears the JSON extras to an empty object when the editor is empty", () => {
    const data = toUpdateData(
      makeValues({ profile_data_json: "", metadata_json: "" }),
    );
    expect(data.profile_data).toEqual({});
    expect(data.metadata).toEqual({});
  });

  it("keeps the slug and never includes published", () => {
    const data = toUpdateData(makeValues({ published: true }));
    expect(data.slug).toBe("marie-curie");
    expect("published" in data).toBe(false);
  });

  it("sends null temporal fields so clearing a date persists", () => {
    const data = toUpdateData(
      makeValues({ birth_temporal: null, death_temporal: null }),
    );
    expect(data.birth_temporal).toBeNull();
    expect(data.death_temporal).toBeNull();
  });

  it("passes a set date through unchanged", () => {
    const data = toUpdateData(makeValues({ birth_temporal: BIRTH }));
    expect(data.birth_temporal).toEqual(BIRTH);
  });
});

describe("seedForAddAnother", () => {
  it("persists type, significance and cultural context; clears the rest", () => {
    const seeded = seedForAddAnother(
      makeValues({
        name: "Marie Curie",
        character_type: "divine",
        significance: "high",
        cultural_context: ["Greek"],
        biography: "…",
        aliases: ["x"],
        birth_temporal: BIRTH,
        pending_primary_media_id: "media-1",
      }),
    );
    expect(seeded.character_type).toBe("divine");
    expect(seeded.significance).toBe("high");
    expect(seeded.cultural_context).toEqual(["Greek"]);
    expect(seeded.name).toBe("");
    expect(seeded.biography).toBe("");
    expect(seeded.aliases).toEqual([]);
    expect(seeded.birth_temporal).toBeNull();
    expect(seeded.pending_primary_media_id).toBeNull();
  });
});

describe("characterFormSchema refinements", () => {
  function base(overrides: Record<string, unknown> = {}) {
    return {
      name: "Valid name",
      character_type: "human",
      slug: "valid-name",
      biography: "",
      aliases: [],
      cultural_context: [],
      physical_description: "",
      species: "",
      breed: "",
      domain: "",
      significance: "medium",
      birth_temporal: null,
      death_temporal: null,
      published: false,
      profile_data_json: "",
      metadata_json: "",
      pending_primary_media_id: null,
      ...overrides,
    };
  }

  it("accepts a valid human", () => {
    expect(characterFormSchema.safeParse(base()).success).toBe(true);
  });

  it("requires a name", () => {
    const result = characterFormSchema.safeParse(base({ name: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });

  it("requires species for an animal", () => {
    const result = characterFormSchema.safeParse(
      base({ character_type: "animal", species: "" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "species")).toBe(
        true,
      );
    }
  });

  it("accepts an animal with a species", () => {
    expect(
      characterFormSchema.safeParse(
        base({ character_type: "animal", species: "Panthera leo" }),
      ).success,
    ).toBe(true);
  });

  it("rejects invalid JSON in an Advanced editor", () => {
    const result = characterFormSchema.safeParse(
      base({ profile_data_json: "{not json" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "profile_data_json"),
      ).toBe(true);
    }
  });
});

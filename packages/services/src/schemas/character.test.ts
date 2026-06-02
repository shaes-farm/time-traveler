import { describe, expect, it } from "vitest";
import {
  characterSchema,
  characterTypeEnum,
  significanceEnum,
} from "./character";

const validBase = {
  slug: "frodo-baggins",
  name: "Frodo Baggins",
  character_type: "fictional" as const,
};

describe("characterTypeEnum", () => {
  it.each(characterTypeEnum.options)("accepts character_type '%s'", (type) => {
    const result = characterSchema.safeParse({
      ...validBase,
      character_type: type,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid character_type", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      character_type: "deity",
    });
    expect(result.success).toBe(false);
  });
});

describe("significanceEnum", () => {
  it.each(significanceEnum.options)("accepts significance '%s'", (sig) => {
    const result = characterSchema.safeParse({
      ...validBase,
      significance: sig,
    });
    expect(result.success).toBe(true);
  });

  it("defaults significance to 'medium' when omitted", () => {
    const result = characterSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.significance).toBe("medium");
  });

  it("rejects an invalid significance value", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      significance: "legendary",
    });
    expect(result.success).toBe(false);
  });
});

describe("characterSchema — temporal fields", () => {
  it("accepts a valid birth_temporal", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      birth_temporal: { year: 1368, era: "CE", precision: "circa" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid death_temporal", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      death_temporal: { year: 1482, era: "CE", precision: "circa" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid TemporalData nested in birth_temporal", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      birth_temporal: { year: 0, era: "CE", precision: "exact" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts undefined birth_temporal (field is optional)", () => {
    const result = characterSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    expect(result.data?.birth_temporal).toBeUndefined();
  });
});

describe("characterSchema — type-specific fields", () => {
  it("accepts species and breed for animal type", () => {
    const result = characterSchema.safeParse({
      slug: "shadow",
      name: "Shadow",
      character_type: "animal",
      species: "Canis lupus familiaris",
      breed: "Labrador Retriever",
    });
    expect(result.success).toBe(true);
  });

  it("accepts domain for divine type", () => {
    const result = characterSchema.safeParse({
      slug: "ares",
      name: "Ares",
      character_type: "divine",
      domain: "War",
    });
    expect(result.success).toBe(true);
  });

  it("accepts domain for organization type", () => {
    const result = characterSchema.safeParse({
      slug: "united-nations",
      name: "United Nations",
      character_type: "organization",
      domain: "International relations",
    });
    expect(result.success).toBe(true);
  });

  it("accepts aliases array", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      aliases: ["Ring-bearer", "Mr. Underhill"],
    });
    expect(result.success).toBe(true);
  });
});

describe("characterSchema — slug and name constraints", () => {
  it("rejects an invalid slug (contains uppercase)", () => {
    const result = characterSchema.safeParse({
      ...validBase,
      slug: "Frodo-Baggins",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = characterSchema.safeParse({ ...validBase, name: "" });
    expect(result.success).toBe(false);
  });
});

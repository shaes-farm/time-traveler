import { describe, it, expect } from "vitest";
import {
  relationshipTypeEnum,
  familyRoleEnum,
  professionalRoleEnum,
  collaborationRoleEnum,
  typeAcceptsRole,
  validateTypeRoleCombination,
  characterRelationshipSchema,
  characterRelationshipBaseSchema,
} from "./character-relationship";

// ---------------------------------------------------------------------------
// relationshipTypeEnum
// ---------------------------------------------------------------------------

describe("relationshipTypeEnum", () => {
  const validTypes = [
    "family",
    "professional",
    "friendship",
    "rivalry",
    "owner_pet",
    "trainer_trainee",
    "creator_creation",
    "worship",
    "collaboration",
    "enemy",
    "mentor_student",
  ] as const;

  it.each(validTypes)("accepts valid type: %s", (type) => {
    expect(() => relationshipTypeEnum.parse(type)).not.toThrow();
  });

  it("rejects an invalid relationship type", () => {
    expect(() => relationshipTypeEnum.parse("ally")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => relationshipTypeEnum.parse("")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// characterRelationshipSchema
// ---------------------------------------------------------------------------

// Proper RFC 4122 v4 UUIDs (version nibble = 4, variant nibble in [89ab])
const UUID_A = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const UUID_B = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

const base = {
  character_id: UUID_A,
  related_character_id: UUID_B,
  relationship_type: "friendship",
} as const;

describe("characterRelationshipSchema", () => {
  it("parses a minimal valid relationship", () => {
    const result = characterRelationshipSchema.parse(base);
    expect(result.character_id).toBe(base.character_id);
    expect(result.related_character_id).toBe(base.related_character_id);
    expect(result.relationship_type).toBe("friendship");
  });

  it("accepts optional description", () => {
    const result = characterRelationshipSchema.parse({
      ...base,
      description: "childhood friends",
    });
    expect(result.description).toBe("childhood friends");
  });

  it("accepts optional temporal scope", () => {
    const temporal = { era: "CE", year: 1800, precision: "approximate" };
    const result = characterRelationshipSchema.parse({
      ...base,
      start_temporal: temporal,
      end_temporal: temporal,
    });
    expect(result.start_temporal).toEqual(temporal);
    expect(result.end_temporal).toEqual(temporal);
  });

  it("accepts optional metadata", () => {
    const result = characterRelationshipSchema.parse({
      ...base,
      metadata: { source: "chapter-3" },
    });
    expect(result.metadata).toEqual({ source: "chapter-3" });
  });

  it("rejects a missing character_id", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        related_character_id: base.related_character_id,
        relationship_type: base.relationship_type,
      }),
    ).toThrow();
  });

  it("rejects a missing related_character_id", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        character_id: base.character_id,
        relationship_type: base.relationship_type,
      }),
    ).toThrow();
  });

  it("rejects a non-UUID character_id", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        character_id: "not-a-uuid",
      }),
    ).toThrow();
  });

  it("rejects an invalid relationship_type", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "acquaintance",
      }),
    ).toThrow();
  });

  it("allows partial via .partial() on the base schema", () => {
    const partial = characterRelationshipBaseSchema.partial();
    expect(() => partial.parse({ description: "updated" })).not.toThrow();
  });

  it("accepts when start_temporal is before end_temporal", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        start_temporal: { era: "CE", year: 1800, precision: "approximate" },
        end_temporal: { era: "CE", year: 1900, precision: "approximate" },
      }),
    ).not.toThrow();
  });

  it("rejects when start_temporal is after end_temporal", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        start_temporal: { era: "CE", year: 1900, precision: "approximate" },
        end_temporal: { era: "CE", year: 1800, precision: "approximate" },
      }),
    ).toThrow("start_temporal must not be later than end_temporal");
  });

  it("accepts when only start_temporal is provided (no end bound)", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        start_temporal: { era: "CE", year: 1900, precision: "approximate" },
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Sub-role enums (#119)
// ---------------------------------------------------------------------------

describe("familyRoleEnum", () => {
  it.each([
    "spouse",
    "parent",
    "child",
    "sibling",
    "grandparent",
    "grandchild",
    "aunt_uncle",
    "niece_nephew",
    "cousin",
    "in_law",
    "step_parent",
    "step_child",
    "step_sibling",
    "adoptive_parent",
    "adoptive_child",
    "other",
  ])("accepts %s", (role) => {
    expect(() => familyRoleEnum.parse(role)).not.toThrow();
  });

  it("rejects unknown role", () => {
    expect(() => familyRoleEnum.parse("ally")).toThrow();
  });
});

describe("professionalRoleEnum", () => {
  it.each([
    "employer",
    "employee",
    "colleague",
    "supervisor",
    "subordinate",
    "business_partner",
    "client",
    "vendor",
    "other",
  ])("accepts %s", (role) => {
    expect(() => professionalRoleEnum.parse(role)).not.toThrow();
  });

  it("rejects family-only role", () => {
    expect(() => professionalRoleEnum.parse("spouse")).toThrow();
  });
});

describe("collaborationRoleEnum", () => {
  it.each([
    "co_author",
    "co_founder",
    "research_partner",
    "performance_partner",
    "band_member",
    "creative_partner",
    "other",
  ])("accepts %s", (role) => {
    expect(() => collaborationRoleEnum.parse(role)).not.toThrow();
  });

  it("rejects professional-only role", () => {
    expect(() => collaborationRoleEnum.parse("employer")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// typeAcceptsRole / validateTypeRoleCombination helpers
// ---------------------------------------------------------------------------

describe("typeAcceptsRole", () => {
  it("returns true for the three sub-roled types", () => {
    expect(typeAcceptsRole("family")).toBe(true);
    expect(typeAcceptsRole("professional")).toBe(true);
    expect(typeAcceptsRole("collaboration")).toBe(true);
  });

  it("returns false for the other 8 types", () => {
    for (const t of [
      "friendship",
      "rivalry",
      "enemy",
      "mentor_student",
      "owner_pet",
      "trainer_trainee",
      "creator_creation",
      "worship",
    ] as const) {
      expect(typeAcceptsRole(t)).toBe(false);
    }
  });
});

describe("validateTypeRoleCombination", () => {
  it("returns null when role is null or undefined", () => {
    expect(validateTypeRoleCombination("family", null)).toBeNull();
    expect(validateTypeRoleCombination("family", undefined)).toBeNull();
    expect(validateTypeRoleCombination("mentor_student", null)).toBeNull();
  });

  it("accepts valid (type, role) pairs", () => {
    expect(validateTypeRoleCombination("family", "parent")).toBeNull();
    expect(validateTypeRoleCombination("professional", "employer")).toBeNull();
    expect(
      validateTypeRoleCombination("collaboration", "co_author"),
    ).toBeNull();
  });

  it("rejects role for types that do not accept sub-roles", () => {
    expect(validateTypeRoleCombination("friendship", "spouse")).toMatch(
      /must be null/,
    );
    expect(validateTypeRoleCombination("mentor_student", "parent")).toMatch(
      /must be null/,
    );
  });

  it("rejects role from a different type's enum", () => {
    expect(validateTypeRoleCombination("family", "employer")).toMatch(
      /not a valid family sub-role/,
    );
    expect(validateTypeRoleCombination("professional", "spouse")).toMatch(
      /not a valid professional sub-role/,
    );
    expect(validateTypeRoleCombination("collaboration", "parent")).toMatch(
      /not a valid collaboration sub-role/,
    );
  });
});

// ---------------------------------------------------------------------------
// characterRelationshipSchema with role validation
// ---------------------------------------------------------------------------

describe("characterRelationshipSchema role refinement (#119)", () => {
  const base = {
    character_id: "11111111-1111-4111-8111-111111111111",
    related_character_id: "22222222-2222-4222-8222-222222222222",
  };

  it("accepts family with a valid family sub-role", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "family",
        relationship_role: "parent",
      }),
    ).not.toThrow();
  });

  it("accepts family with null role (backwards compat)", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "family",
        relationship_role: null,
      }),
    ).not.toThrow();
  });

  it("rejects family with a professional sub-role", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "family",
        relationship_role: "employer",
      }),
    ).toThrow(/not a valid family sub-role/);
  });

  it("rejects friendship with any non-null sub-role", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "friendship",
        relationship_role: "spouse",
      }),
    ).toThrow(/must be null/);
  });

  it("accepts friendship with null role (or omitted)", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "friendship",
      }),
    ).not.toThrow();
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "friendship",
        relationship_role: null,
      }),
    ).not.toThrow();
  });
});

import { describe, it, expect } from "vitest";
import {
  relationshipTypeEnum,
  characterRelationshipSchema,
} from "./character-relationship.js";

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

  it("allows partial via .partial()", () => {
    const partial = characterRelationshipSchema.partial();
    expect(() => partial.parse({ description: "updated" })).not.toThrow();
  });
});

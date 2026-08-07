import { describe, it, expect } from "vitest";
import {
  relationshipTypeKeySchema,
  typeAcceptsRole,
  validateTypeRoleCombination,
  characterRelationshipSchema,
  characterRelationshipBaseSchema,
  makeCharacterRelationshipSchema,
} from "./character-relationship";
import { toVocabulary } from "./relationship-vocabulary";
import type {
  RelationshipCategoryMeta,
  RelationshipRoleMeta,
  RelationshipTypeMeta,
} from "./relationship-vocabulary";

// ---------------------------------------------------------------------------
// Vocabulary fixture
//
// The legal type set is reference data now, so these tests build a small
// vocabulary rather than asserting against a compiled-in enum.
// ---------------------------------------------------------------------------

const mkRole = (
  type_key: string,
  key: string,
  inverse_key: string | null,
): RelationshipRoleMeta => ({
  type_key,
  key,
  label: key,
  inverse_key,
  sort_order: 0,
  is_active: true,
});

const mkType = (
  key: string,
  category_key: string,
  overrides: Partial<RelationshipTypeMeta> = {},
): RelationshipTypeMeta => ({
  key,
  label: key,
  category_key,
  sort_order: 0,
  is_symmetric: true,
  inverse_key: null,
  direction_verb: null,
  symmetric_noun: null,
  description: null,
  is_active: true,
  roles: [],
  ...overrides,
});

const CATEGORIES: RelationshipCategoryMeta[] = [
  {
    key: "social",
    label: "Social",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      mkType("family", "social", {
        roles: [
          mkRole("family", "parent", "child"),
          mkRole("family", "child", "parent"),
          mkRole("family", "spouse", "spouse"),
        ],
      }),
      mkType("professional", "social", {
        roles: [
          mkRole("professional", "employer", "employee"),
          mkRole("professional", "employee", "employer"),
        ],
      }),
      mkType("collaboration", "social", {
        roles: [mkRole("collaboration", "co_author", "co_author")],
      }),
      mkType("friendship", "social", { symmetric_noun: "friends" }),
    ],
  },
  {
    key: "asymmetric",
    label: "Asymmetric",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [
      mkType("mentor_student", "asymmetric", {
        is_symmetric: false,
        direction_verb: "mentors",
      }),
    ],
  },
];

const VOCABULARY = toVocabulary(CATEGORIES);

// ---------------------------------------------------------------------------
// relationshipTypeKeySchema — shape only; membership is the database's job
// ---------------------------------------------------------------------------

describe("relationshipTypeKeySchema", () => {
  it.each([
    "family",
    "professional",
    "friendship",
    "mentor_student",
    "derived_from",
  ])("accepts a well-formed key: %s", (key) => {
    expect(() => relationshipTypeKeySchema.parse(key)).not.toThrow();
  });

  it("accepts a key it has never seen — the vocabulary is data, not code", () => {
    // The whole point of #419: a type added through the admin UI must validate
    // without any code change here.
    expect(() =>
      relationshipTypeKeySchema.parse("some_brand_new_verb"),
    ).not.toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => relationshipTypeKeySchema.parse("")).toThrow();
  });

  it.each(["Family", "has spaces", "1leading_digit", "trailing-hyphen"])(
    "rejects a malformed key: %s",
    (key) => {
      expect(() => relationshipTypeKeySchema.parse(key)).toThrow();
    },
  );
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

  it("accepts an unknown relationship_type — the FK is the authority", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "acquaintance",
      }),
    ).not.toThrow();
  });

  it("still rejects a malformed relationship_type", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...base,
        relationship_type: "Not A Key",
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
// typeAcceptsRole / validateTypeRoleCombination — now vocabulary-driven
// ---------------------------------------------------------------------------

describe("typeAcceptsRole", () => {
  it("is true for types that declare sub-roles", () => {
    expect(typeAcceptsRole("family", VOCABULARY)).toBe(true);
    expect(typeAcceptsRole("professional", VOCABULARY)).toBe(true);
    expect(typeAcceptsRole("collaboration", VOCABULARY)).toBe(true);
  });

  it("is false for types with no sub-roles", () => {
    expect(typeAcceptsRole("friendship", VOCABULARY)).toBe(false);
    expect(typeAcceptsRole("mentor_student", VOCABULARY)).toBe(false);
  });

  it("is false for a type absent from the vocabulary", () => {
    expect(typeAcceptsRole("not_in_vocabulary", VOCABULARY)).toBe(false);
  });
});

describe("validateTypeRoleCombination", () => {
  it("returns null when role is null or undefined", () => {
    expect(validateTypeRoleCombination("family", null, VOCABULARY)).toBeNull();
    expect(
      validateTypeRoleCombination("family", undefined, VOCABULARY),
    ).toBeNull();
    expect(
      validateTypeRoleCombination("mentor_student", null, VOCABULARY),
    ).toBeNull();
  });

  it("accepts valid (type, role) pairs", () => {
    expect(
      validateTypeRoleCombination("family", "parent", VOCABULARY),
    ).toBeNull();
    expect(
      validateTypeRoleCombination("professional", "employer", VOCABULARY),
    ).toBeNull();
    expect(
      validateTypeRoleCombination("collaboration", "co_author", VOCABULARY),
    ).toBeNull();
  });

  it("rejects a role on a type that declares none", () => {
    expect(
      validateTypeRoleCombination("friendship", "spouse", VOCABULARY),
    ).toMatch(/must be null/);
    expect(
      validateTypeRoleCombination("mentor_student", "parent", VOCABULARY),
    ).toMatch(/must be null/);
  });

  it("rejects a role belonging to a different type", () => {
    expect(
      validateTypeRoleCombination("family", "employer", VOCABULARY),
    ).toMatch(/not a valid sub-role of "family"/);
    expect(
      validateTypeRoleCombination("professional", "spouse", VOCABULARY),
    ).toMatch(/not a valid sub-role of "professional"/);
  });

  it("defers to the database for a type it has never seen", () => {
    // A stale client must not block a write the database would accept.
    expect(
      validateTypeRoleCombination("added_yesterday", "some_role", VOCABULARY),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// makeCharacterRelationshipSchema — opt-in, vocabulary-aware validation
// ---------------------------------------------------------------------------

describe("makeCharacterRelationshipSchema", () => {
  const scoped = makeCharacterRelationshipSchema(VOCABULARY);
  const pair = {
    character_id: "11111111-1111-4111-8111-111111111111",
    related_character_id: "22222222-2222-4222-8222-222222222222",
  };

  it("accepts a valid (type, role) pair", () => {
    expect(() =>
      scoped.parse({
        ...pair,
        relationship_type: "family",
        relationship_role: "parent",
      }),
    ).not.toThrow();
  });

  it("accepts a null role for any type", () => {
    expect(() =>
      scoped.parse({
        ...pair,
        relationship_type: "family",
        relationship_role: null,
      }),
    ).not.toThrow();
    expect(() =>
      scoped.parse({ ...pair, relationship_type: "friendship" }),
    ).not.toThrow();
  });

  it("rejects a role from another type", () => {
    // ZodError.message is the JSON-serialized issue list, so the quotes around
    // the type name arrive escaped — match without them.
    expect(() =>
      scoped.parse({
        ...pair,
        relationship_type: "family",
        relationship_role: "employer",
      }),
    ).toThrow(/is not a valid sub-role of/);
  });

  it("rejects a role on a type that declares none", () => {
    expect(() =>
      scoped.parse({
        ...pair,
        relationship_type: "friendship",
        relationship_role: "spouse",
      }),
    ).toThrow(/must be null/);
  });

  it("still enforces temporal ordering", () => {
    expect(() =>
      scoped.parse({
        ...pair,
        relationship_type: "friendship",
        start_temporal: { era: "CE", year: 1900, precision: "approximate" },
        end_temporal: { era: "CE", year: 1800, precision: "approximate" },
      }),
    ).toThrow("start_temporal must not be later than end_temporal");
  });

  it("lets an unknown type through to the database", () => {
    expect(() =>
      scoped.parse({ ...pair, relationship_type: "added_yesterday" }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// The default schema does no value-level checking
// ---------------------------------------------------------------------------

describe("characterRelationshipSchema (shape-only)", () => {
  const pair = {
    character_id: "11111111-1111-4111-8111-111111111111",
    related_character_id: "22222222-2222-4222-8222-222222222222",
  };

  it("does not reject a (type, role) mismatch — the composite FK does", () => {
    expect(() =>
      characterRelationshipSchema.parse({
        ...pair,
        relationship_type: "friendship",
        relationship_role: "spouse",
      }),
    ).not.toThrow();
  });
});

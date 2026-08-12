import { describe, expect, it } from "vitest";

import {
  blankCategory,
  blankRole,
  blankType,
  categoryFormSchema,
  mapCategoryToFormValues,
  mapRoleToFormValues,
  mapTypeToFormValues,
  roleFormSchema,
  symmetryModeOf,
  toCategoryCreateInput,
  toCategoryUpdateData,
  toRoleCreateInput,
  toRoleUpdateData,
  toTypeCreateInput,
  toTypeUpdateData,
  typeFormSchema,
  type TypeFormValues,
} from "./vocabulary-form-mappers";
import type {
  RelationshipCategoryMeta,
  RelationshipRoleMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

const CATEGORY: RelationshipCategoryMeta = {
  key: "family",
  label: "Family",
  description: "Kinship ties",
  sort_order: 10,
  is_active: true,
  types: [],
};

const SYMMETRIC_TYPE: RelationshipTypeMeta = {
  key: "friendship",
  label: "Friendship",
  category_key: "social",
  sort_order: 10,
  is_symmetric: true,
  inverse_key: null,
  direction_verb: null,
  symmetric_noun: "friends",
  description: null,
  is_active: true,
  roles: [],
};

const DIRECTED_TYPE: RelationshipTypeMeta = {
  ...SYMMETRIC_TYPE,
  key: "mentor_student",
  label: "Mentor",
  is_symmetric: false,
  inverse_key: null,
  direction_verb: "mentors",
  symmetric_noun: null,
};

const INVERSE_TYPE: RelationshipTypeMeta = {
  ...DIRECTED_TYPE,
  inverse_key: "student_mentor",
};

const ROLE: RelationshipRoleMeta = {
  type_key: "parent_child",
  key: "parent",
  label: "Parent",
  inverse_key: "child",
  sort_order: 10,
  is_active: true,
};

const validType = (
  overrides: Partial<TypeFormValues> = {},
): TypeFormValues => ({
  key: "friendship",
  label: "Friendship",
  category_key: "social",
  symmetry: "symmetric",
  inverse_key: "",
  direction_verb: "",
  symmetric_noun: "friends",
  description: "",
  sort_order: 10,
  is_active: true,
  ...overrides,
});

describe("symmetryModeOf", () => {
  it("maps the three legal column combinations onto the three modes", () => {
    expect(symmetryModeOf(SYMMETRIC_TYPE)).toBe("symmetric");
    expect(symmetryModeOf(DIRECTED_TYPE)).toBe("directed");
    expect(symmetryModeOf(INVERSE_TYPE)).toBe("inverse");
  });
});

describe("category mappers", () => {
  it("round-trips a category through the form", () => {
    const values = mapCategoryToFormValues(CATEGORY);
    expect(values).toEqual({
      key: "family",
      label: "Family",
      description: "Kinship ties",
      sort_order: 10,
      is_active: true,
    });
    expect(toCategoryCreateInput(values)).toEqual({
      key: "family",
      label: "Family",
      description: "Kinship ties",
      sort_order: 10,
      is_active: true,
    });
  });

  it("models a null description as an empty string and back again", () => {
    const values = mapCategoryToFormValues({ ...CATEGORY, description: null });
    expect(values.description).toBe("");
    expect(toCategoryCreateInput(values).description).toBeNull();
  });

  it("omits `key` from the update patch", () => {
    // Keys are immutable after creation (ADR-0041) — a patch must not be able
    // to carry one, since the FKs are ON UPDATE CASCADE.
    expect(
      toCategoryUpdateData(mapCategoryToFormValues(CATEGORY)),
    ).not.toHaveProperty("key");
  });

  it("seeds a new category with the supplied sort order", () => {
    expect(blankCategory(40)).toMatchObject({ key: "", sort_order: 40 });
  });

  it("rejects a category key over 50 characters", () => {
    // relationship_categories.key is VARCHAR(50) where types/roles are 100.
    const result = categoryFormSchema.safeParse({
      ...mapCategoryToFormValues(CATEGORY),
      key: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a key that isn't a snake_case slug", () => {
    expect(
      categoryFormSchema.safeParse({
        ...mapCategoryToFormValues(CATEGORY),
        key: "Not-A-Key",
      }).success,
    ).toBe(false);
  });
});

describe("type mappers", () => {
  it("hydrates the symmetry mode from the persisted columns", () => {
    expect(mapTypeToFormValues(INVERSE_TYPE)).toMatchObject({
      symmetry: "inverse",
      inverse_key: "student_mentor",
      direction_verb: "mentors",
      symmetric_noun: "",
    });
  });

  it("derives symmetric columns and drops the directed ones", () => {
    const input = toTypeCreateInput(validType());
    expect(input).toMatchObject({
      is_symmetric: true,
      inverse_key: null,
      direction_verb: null,
      symmetric_noun: "friends",
    });
  });

  it("derives inverse columns and drops the symmetric noun", () => {
    const input = toTypeCreateInput(
      validType({
        symmetry: "inverse",
        inverse_key: "student_mentor",
        direction_verb: "mentors",
        symmetric_noun: "friends",
      }),
    );
    expect(input).toMatchObject({
      is_symmetric: false,
      inverse_key: "student_mentor",
      direction_verb: "mentors",
      symmetric_noun: null,
    });
  });

  it("drops a stale inverse when the mode switches back to symmetric", () => {
    // This is the whole point of deriving the columns from a mode: a user who
    // fills in an inverse and then picks "symmetric" must not leave the
    // inverse behind, because that combination is what the CHECK rejects.
    const input = toTypeCreateInput(
      validType({ symmetry: "symmetric", inverse_key: "student_mentor" }),
    );
    expect(input.is_symmetric).toBe(true);
    expect(input.inverse_key).toBeNull();
  });

  it("never produces the combination the database rejects", () => {
    const modes = ["symmetric", "inverse", "directed"] as const;
    for (const symmetry of modes) {
      const input = toTypeCreateInput(
        validType({
          symmetry,
          inverse_key: "student_mentor",
          direction_verb: "mentors",
          symmetric_noun: "friends",
        }),
      );
      expect(input.is_symmetric && input.inverse_key !== null).toBe(false);
    }
  });

  it("omits `key` from the update patch", () => {
    expect(toTypeUpdateData(validType())).not.toHaveProperty("key");
  });

  it("seeds a new type into the given category", () => {
    expect(blankType("social", 30)).toMatchObject({
      category_key: "social",
      sort_order: 30,
      symmetry: "symmetric",
    });
  });
});

describe("typeFormSchema editorial rules", () => {
  it("accepts a well-formed symmetric type", () => {
    expect(typeFormSchema.safeParse(validType()).success).toBe(true);
  });

  it("requires a noun for a symmetric type", () => {
    const result = typeFormSchema.safeParse(
      validType({ symmetric_noun: "   " }),
    );
    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((i) => i.path[0]),
    ).toContain("symmetric_noun");
  });

  it("requires a verb for both directed modes", () => {
    for (const symmetry of ["directed", "inverse"] as const) {
      const result = typeFormSchema.safeParse(
        validType({
          symmetry,
          inverse_key: symmetry === "inverse" ? "student_mentor" : "",
          direction_verb: "",
          symmetric_noun: "",
        }),
      );
      expect(result.success).toBe(false);
    }
  });

  it("requires an inverse type when the mode is `inverse`", () => {
    const result = typeFormSchema.safeParse(
      validType({
        symmetry: "inverse",
        inverse_key: "",
        direction_verb: "mentors",
        symmetric_noun: "",
      }),
    );
    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((i) => i.path[0]),
    ).toContain("inverse_key");
  });

  it("does not require a noun for a directed type", () => {
    expect(
      typeFormSchema.safeParse(
        validType({
          symmetry: "directed",
          direction_verb: "influenced",
          symmetric_noun: "",
        }),
      ).success,
    ).toBe(true);
  });
});

describe("role mappers", () => {
  it("round-trips a role", () => {
    const values = mapRoleToFormValues(ROLE);
    expect(values).toEqual({
      type_key: "parent_child",
      key: "parent",
      label: "Parent",
      inverse_key: "child",
      sort_order: 10,
      is_active: true,
    });
    expect(toRoleCreateInput(values).inverse_key).toBe("child");
  });

  it("models 'no inverse' as an empty string and writes it back as null", () => {
    const values = mapRoleToFormValues({ ...ROLE, inverse_key: null });
    expect(values.inverse_key).toBe("");
    expect(toRoleCreateInput(values).inverse_key).toBeNull();
  });

  it("omits both halves of the composite key from the update patch", () => {
    const patch = toRoleUpdateData(mapRoleToFormValues(ROLE));
    expect(patch).not.toHaveProperty("key");
    expect(patch).not.toHaveProperty("type_key");
  });

  it("seeds a new role under its parent type", () => {
    expect(blankRole("parent_child", 20)).toMatchObject({
      type_key: "parent_child",
      sort_order: 20,
    });
  });

  it("validates the role key shape", () => {
    expect(
      roleFormSchema.safeParse({ ...mapRoleToFormValues(ROLE), key: "Bad Key" })
        .success,
    ).toBe(false);
  });
});

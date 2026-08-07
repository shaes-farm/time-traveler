import { describe, it, expect } from "vitest";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { toVocabulary } from "@repo/services/schemas/relationship-vocabulary";
import type {
  RelationshipCategoryMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";
import {
  directionLabel,
  familyForType,
  groupRelationshipsByFamily,
  initials,
  livedYears,
  otherCharacterId,
  UNGROUPED_FAMILY_KEY,
  type RelationshipLike,
} from "./character-detail-helpers";

// ---------------------------------------------------------------------------
// Vocabulary fixture
//
// Grouping and the narrative direction lines are driven by relationship_types /
// relationship_categories since #419, so these helpers take the vocabulary
// instead of consulting hard-coded maps.
// ---------------------------------------------------------------------------

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
    key: "family",
    label: "Family",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [mkType("family", "family", { symmetric_noun: "relatives" })],
  },
  {
    key: "professional",
    label: "Professional",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [
      mkType("professional", "professional", { symmetric_noun: "colleagues" }),
      mkType("collaboration", "professional", {
        symmetric_noun: "collaborators",
      }),
    ],
  },
  {
    key: "social",
    label: "Social / Personal",
    description: null,
    sort_order: 30,
    is_active: true,
    types: [
      mkType("friendship", "social", { symmetric_noun: "friends" }),
      mkType("rivalry", "social", { symmetric_noun: "rivals" }),
    ],
  },
  {
    key: "antagonistic",
    label: "Antagonistic",
    description: null,
    sort_order: 40,
    is_active: true,
    types: [mkType("enemy", "antagonistic", { symmetric_noun: "enemies" })],
  },
  {
    key: "asymmetric",
    label: "Asymmetric",
    description: null,
    sort_order: 50,
    is_active: true,
    types: [
      mkType("mentor_student", "asymmetric", {
        is_symmetric: false,
        direction_verb: "mentors",
      }),
      mkType("worship", "asymmetric", {
        is_symmetric: false,
        direction_verb: "worships",
      }),
    ],
  },
];

const VOCAB = toVocabulary(CATEGORIES);

function rel(overrides: Partial<RelationshipLike> = {}): RelationshipLike {
  return {
    id: "r1",
    character_id: "a",
    related_character_id: "b",
    relationship_type: "family",
    relationship_role: null,
    start_temporal: null,
    end_temporal: null,
    description: null,
    ...overrides,
  };
}

const ce = (year: number): TemporalData => ({
  year,
  era: "CE",
  precision: "exact",
});

describe("familyForType", () => {
  it("maps each type to its wireframe family", () => {
    expect(familyForType("family", VOCAB)).toBe("family");
    expect(familyForType("professional", VOCAB)).toBe("professional");
    expect(familyForType("collaboration", VOCAB)).toBe("professional");
    expect(familyForType("friendship", VOCAB)).toBe("social");
    expect(familyForType("rivalry", VOCAB)).toBe("social");
    expect(familyForType("enemy", VOCAB)).toBe("antagonistic");
    expect(familyForType("mentor_student", VOCAB)).toBe("asymmetric");
    expect(familyForType("worship", VOCAB)).toBe("asymmetric");
  });

  it("puts types absent from the vocabulary in their own bucket", () => {
    // Previously these fell back to "social", silently mis-filing a causal
    // verb under a social heading. They now get an explicit bucket.
    expect(familyForType("nonsense", VOCAB)).toBe(UNGROUPED_FAMILY_KEY);
    expect(familyForType("superseded", VOCAB)).toBe(UNGROUPED_FAMILY_KEY);
  });
});

describe("otherCharacterId", () => {
  it("returns the non-focal end regardless of column position", () => {
    expect(
      otherCharacterId({ character_id: "a", related_character_id: "b" }, "a"),
    ).toBe("b");
    expect(
      otherCharacterId({ character_id: "a", related_character_id: "b" }, "b"),
    ).toBe("a");
  });
});

describe("groupRelationshipsByFamily", () => {
  it("groups into families in canonical order, dropping empty families", () => {
    const groups = groupRelationshipsByFamily(
      [
        rel({ id: "1", relationship_type: "enemy" }),
        rel({ id: "2", relationship_type: "family" }),
        rel({ id: "3", relationship_type: "collaboration" }),
      ],
      CATEGORIES,
      VOCAB,
    );
    expect(groups.map((g) => g.key)).toEqual([
      "family",
      "professional",
      "antagonistic",
    ]);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["2"]);
    expect(groups[1]!.items.map((i) => i.id)).toEqual(["3"]);
  });

  it("preserves input order within a family", () => {
    const groups = groupRelationshipsByFamily(
      [
        rel({ id: "x", relationship_type: "professional" }),
        rel({ id: "y", relationship_type: "collaboration" }),
      ],
      CATEGORIES,
      VOCAB,
    );
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["x", "y"]);
  });

  it("returns an empty array when there are no relationships", () => {
    expect(groupRelationshipsByFamily([], CATEGORIES, VOCAB)).toEqual([]);
  });
});

describe("directionLabel", () => {
  const names = { subjectName: "Marie", objectName: "Irène" };

  it("renders a verb phrase for asymmetric types", () => {
    expect(
      directionLabel(
        {
          relationship_type: "mentor_student",
          relationship_role: null,
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie mentors Irène");
    expect(
      directionLabel(
        {
          relationship_type: "worship",
          relationship_role: null,
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie worships Irène");
  });

  it("renders the role for directional paired roles", () => {
    expect(
      directionLabel(
        {
          relationship_type: "family",
          relationship_role: "parent",
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie is the parent of Irène");
    expect(
      directionLabel(
        {
          relationship_type: "professional",
          relationship_role: "employer",
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie is the employer of Irène");
  });

  it("humanizes underscored roles", () => {
    expect(
      directionLabel(
        {
          relationship_type: "family",
          relationship_role: "aunt_uncle",
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie is the aunt uncle of Irène");
  });

  it("renders symmetric sub-roles as an 'is the <role> of' phrase", () => {
    expect(
      directionLabel(
        {
          relationship_type: "family",
          relationship_role: "spouse",
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie is the spouse of Irène");
  });

  it("renders type-only symmetric relationships as a plural noun phrase", () => {
    expect(
      directionLabel(
        {
          relationship_type: "friendship",
          relationship_role: null,
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie and Irène are friends");
    expect(
      directionLabel(
        {
          relationship_type: "enemy",
          relationship_role: null,
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie and Irène are enemies");
  });

  it("treats the 'other' role as type-only (no 'is the other of' phrasing)", () => {
    expect(
      directionLabel(
        {
          relationship_type: "collaboration",
          relationship_role: "other",
          character_id: "a",
        },
        names,
        VOCAB,
      ),
    ).toBe("Marie and Irène are collaborators");
  });
});

describe("initials", () => {
  it("builds up to two initials", () => {
    expect(initials("Marie Curie")).toBe("MC");
    expect(initials("Cher")).toBe("CH");
    expect(initials("Marie Skłodowska Curie")).toBe("MC");
  });

  it("handles empty input", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("livedYears", () => {
  it("computes whole years between CE dates", () => {
    expect(livedYears(ce(1867), ce(1934))).toBe(67);
  });

  it("spans BCE→CE", () => {
    expect(
      livedYears({ year: 100, era: "BCE", precision: "exact" }, ce(44)),
    ).toBe(144);
  });

  it("returns null when a bound is missing", () => {
    expect(livedYears(null, ce(1934))).toBeNull();
    expect(livedYears(ce(1867), undefined)).toBeNull();
  });

  it("returns null for geological eras", () => {
    expect(
      livedYears(
        { year: 3, era: "MYA", precision: "exact" },
        { year: 1, era: "MYA", precision: "exact" },
      ),
    ).toBeNull();
  });

  it("returns null when death precedes birth", () => {
    expect(livedYears(ce(1934), ce(1867))).toBeNull();
  });
});

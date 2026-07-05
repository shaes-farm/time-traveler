import { describe, it, expect } from "vitest";
import type { TemporalData } from "@repo/services/schemas/temporal";
import {
  directionLabel,
  familyForType,
  groupRelationshipsByFamily,
  initials,
  livedYears,
  otherCharacterId,
  type RelationshipLike,
} from "./character-detail-helpers";

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
    expect(familyForType("family")).toBe("family");
    expect(familyForType("professional")).toBe("professional");
    expect(familyForType("collaboration")).toBe("professional");
    expect(familyForType("friendship")).toBe("social");
    expect(familyForType("rivalry")).toBe("social");
    expect(familyForType("enemy")).toBe("antagonistic");
    expect(familyForType("mentor_student")).toBe("asymmetric");
    expect(familyForType("worship")).toBe("asymmetric");
  });

  it("falls back to social for unknown types", () => {
    expect(familyForType("nonsense")).toBe("social");
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
    const groups = groupRelationshipsByFamily([
      rel({ id: "1", relationship_type: "enemy" }),
      rel({ id: "2", relationship_type: "family" }),
      rel({ id: "3", relationship_type: "collaboration" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual([
      "family",
      "professional",
      "antagonistic",
    ]);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["2"]);
    expect(groups[1]!.items.map((i) => i.id)).toEqual(["3"]);
  });

  it("preserves input order within a family", () => {
    const groups = groupRelationshipsByFamily([
      rel({ id: "x", relationship_type: "professional" }),
      rel({ id: "y", relationship_type: "collaboration" }),
    ]);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["x", "y"]);
  });

  it("returns an empty array when there are no relationships", () => {
    expect(groupRelationshipsByFamily([])).toEqual([]);
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
      ),
    ).toBe("Marie is the aunt uncle of Irène");
  });

  it("returns undefined for symmetric roles and type-only symmetric relationships", () => {
    expect(
      directionLabel(
        {
          relationship_type: "family",
          relationship_role: "spouse",
          character_id: "a",
        },
        names,
      ),
    ).toBeUndefined();
    expect(
      directionLabel(
        {
          relationship_type: "friendship",
          relationship_role: null,
          character_id: "a",
        },
        names,
      ),
    ).toBeUndefined();
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

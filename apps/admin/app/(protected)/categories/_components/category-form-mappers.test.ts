import { describe, it, expect } from "vitest";

import type { CategoryNode } from "@repo/services/category-service";

import {
  categoryFormSchema,
  BLANK_VALUES,
  mapNodeToFormValues,
  blankForParent,
  toCreateInput,
  toUpdateData,
  type CategoryFormValues,
} from "./category-form-mappers";

function makeValues(
  overrides: Partial<CategoryFormValues> = {},
): CategoryFormValues {
  return {
    ...BLANK_VALUES,
    title: "Physics",
    slug: "physics",
    ...overrides,
  };
}

function makeNode(overrides: Partial<CategoryNode> = {}): CategoryNode {
  return {
    id: "cat-1",
    user_id: "user-1",
    slug: "physics",
    title: "Physics",
    description: null,
    color: null,
    icon: null,
    parent_category_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    children: [],
    ...overrides,
  };
}

describe("categoryFormSchema", () => {
  it("accepts a valid root category with unset color/icon", () => {
    const result = categoryFormSchema.safeParse(makeValues());
    expect(result.success).toBe(true);
  });

  it("requires a title", () => {
    const result = categoryFormSchema.safeParse(makeValues({ title: "" }));
    expect(result.success).toBe(false);
  });

  it("accepts an empty color (the 'unset' sentinel)", () => {
    const result = categoryFormSchema.safeParse(makeValues({ color: "" }));
    expect(result.success).toBe(true);
  });

  it("accepts a valid 6-digit hex color", () => {
    const result = categoryFormSchema.safeParse(
      makeValues({ color: "#8b5cf6" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a malformed color", () => {
    const result = categoryFormSchema.safeParse(
      makeValues({ color: "purple" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["color"]);
    }
  });

  it("rejects a 3-digit hex color", () => {
    const result = categoryFormSchema.safeParse(makeValues({ color: "#abc" }));
    expect(result.success).toBe(false);
  });

  it("accepts a null parent (root) and a uuid parent", () => {
    expect(
      categoryFormSchema.safeParse(makeValues({ parent_category_id: null }))
        .success,
    ).toBe(true);
    expect(
      categoryFormSchema.safeParse(
        makeValues({
          parent_category_id: "11111111-1111-4111-8111-111111111111",
        }),
      ).success,
    ).toBe(true);
  });
});

describe("mapNodeToFormValues", () => {
  it("maps nullable columns to editor defaults", () => {
    expect(mapNodeToFormValues(makeNode())).toEqual({
      title: "Physics",
      slug: "physics",
      description: "",
      color: "",
      icon: "",
      parent_category_id: null,
    });
  });

  it("preserves populated fields", () => {
    const values = mapNodeToFormValues(
      makeNode({
        description: "Sub-atomic behavior",
        color: "#8b5cf6",
        icon: "atom",
        parent_category_id: "cat-parent",
      }),
    );
    expect(values.description).toBe("Sub-atomic behavior");
    expect(values.color).toBe("#8b5cf6");
    expect(values.icon).toBe("atom");
    expect(values.parent_category_id).toBe("cat-parent");
  });
});

describe("blankForParent", () => {
  it("defaults to a root category", () => {
    expect(blankForParent()).toEqual(BLANK_VALUES);
    expect(blankForParent().parent_category_id).toBeNull();
  });

  it("pre-parents the blank form when given an id", () => {
    const values = blankForParent("cat-parent");
    expect(values.parent_category_id).toBe("cat-parent");
    expect(values.title).toBe("");
  });
});

describe("toCreateInput", () => {
  it("omits blank optional fields and an empty slug", () => {
    const input = toCreateInput(makeValues({ slug: "" }));
    expect(input.slug).toBeUndefined();
    expect(input.description).toBeUndefined();
    expect(input.color).toBeUndefined();
    expect(input.icon).toBeUndefined();
    expect(input.title).toBe("Physics");
  });

  it("passes through populated fields and the parent id", () => {
    const input = toCreateInput(
      makeValues({
        slug: "quantum",
        description: "d",
        color: "#8b5cf6",
        icon: "atom",
        parent_category_id: "cat-parent",
      }),
    );
    expect(input.slug).toBe("quantum");
    expect(input.description).toBe("d");
    expect(input.color).toBe("#8b5cf6");
    expect(input.icon).toBe("atom");
    expect(input.parent_category_id).toBe("cat-parent");
  });

  it("keeps a null parent (root) rather than dropping it", () => {
    expect(toCreateInput(makeValues()).parent_category_id).toBeNull();
  });
});

describe("toUpdateData", () => {
  it("sends description as-is (including empty) so a clear persists", () => {
    expect(toUpdateData(makeValues({ description: "" })).description).toBe("");
  });

  it("omits empty color/icon (schema can't express clear-to-null)", () => {
    const data = toUpdateData(makeValues({ color: "", icon: "" }));
    expect(data.color).toBeUndefined();
    expect(data.icon).toBeUndefined();
  });

  it("sends a null parent to reparent to root", () => {
    expect(
      toUpdateData(makeValues({ parent_category_id: null })).parent_category_id,
    ).toBeNull();
  });

  it("sends a uuid parent to reparent under a node", () => {
    expect(
      toUpdateData(makeValues({ parent_category_id: "cat-parent" }))
        .parent_category_id,
    ).toBe("cat-parent");
  });
});

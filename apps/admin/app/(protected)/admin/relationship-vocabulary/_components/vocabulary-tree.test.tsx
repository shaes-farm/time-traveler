import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";

import { VocabularyTree } from "./vocabulary-tree";

const CATEGORIES: RelationshipCategoryMeta[] = [
  {
    key: "family",
    label: "Family",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      {
        key: "parent_child",
        label: "Parent / Child",
        category_key: "family",
        sort_order: 10,
        is_symmetric: false,
        inverse_key: null,
        direction_verb: "is the parent of",
        symmetric_noun: null,
        description: null,
        is_active: true,
        roles: [
          {
            type_key: "parent_child",
            key: "parent",
            label: "Parent",
            inverse_key: "child",
            sort_order: 10,
            is_active: true,
          },
        ],
      },
    ],
  },
  {
    key: "professional",
    label: "Professional",
    description: null,
    sort_order: 20,
    is_active: false,
    types: [],
  },
];

function renderTree(
  props: Partial<React.ComponentProps<typeof VocabularyTree>> = {},
) {
  return render(
    <VocabularyTree
      categories={CATEGORIES}
      selection={null}
      onSelect={vi.fn()}
      onReorder={vi.fn()}
      reorderPending={false}
      {...props}
    />,
  );
}

describe("VocabularyTree", () => {
  it("renders both categories collapsed, types and roles hidden until expanded", () => {
    renderTree();
    expect(
      screen.getByRole("treeitem", { name: /Family/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("treeitem", { name: /Parent \/ Child/ }),
    ).not.toBeInTheDocument();
  });

  it("marks an inactive category with a badge", () => {
    renderTree();
    const professional = screen.getByRole("treeitem", {
      name: /Professional/,
    });
    expect(within(professional).getByText("Inactive")).toBeInTheDocument();
  });

  it("reveals types and roles once expanded", async () => {
    const user = userEvent.setup();
    renderTree();

    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(
      screen.getByRole("treeitem", { name: /Parent \/ Child/ }),
    ).toBeInTheDocument();

    // The category's own toggle is now "Collapse" — the one remaining
    // "Expand" button belongs to the type row.
    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(
      screen.getByRole("treeitem", { name: /^Parent$/ }),
    ).toBeInTheDocument();
  });

  it("selects a category on activation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTree({ onSelect });

    await user.click(screen.getByRole("treeitem", { name: /Family/ }));
    expect(onSelect).toHaveBeenCalledWith({ level: "category", key: "family" });
  });

  it("selects a role with its parent type as the composite key", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTree({ onSelect });

    await user.click(screen.getByRole("button", { name: "Expand" }));
    await user.click(screen.getByRole("button", { name: "Expand" }));
    await user.click(screen.getByRole("treeitem", { name: /^Parent$/ }));

    expect(onSelect).toHaveBeenCalledWith({
      level: "role",
      key: "parent",
      parentKey: "parent_child",
    });
  });

  it("marks the row matching the current selection", () => {
    renderTree({ selection: { level: "category", key: "family" } });
    expect(screen.getByRole("treeitem", { name: /Family/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("treeitem", { name: /Professional/ }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("disables the up arrow on the first category and the down arrow on the last", () => {
    renderTree();
    expect(
      screen.getByRole("button", { name: "Move Family up" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move Family down" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Move Professional down" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move Professional up" }),
    ).toBeEnabled();
  });

  it("routes a reorder click to onReorder with the level, key and direction", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    renderTree({ onReorder });

    await user.click(screen.getByRole("button", { name: "Move Family down" }));
    expect(onReorder).toHaveBeenCalledWith("category", "family", "down");
  });

  it("does not also select the row when a reorder button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTree({ onSelect });

    await user.click(screen.getByRole("button", { name: "Move Family down" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("disables every reorder button while a reorder is already pending", () => {
    renderTree({ reorderPending: true });
    expect(
      screen.getByRole("button", { name: "Move Family down" }),
    ).toBeDisabled();
  });
});

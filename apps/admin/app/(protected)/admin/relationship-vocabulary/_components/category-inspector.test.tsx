import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";

const createRelationshipCategory = vi.fn();
const updateRelationshipCategory = vi.fn();
const deleteRelationshipCategory = vi.fn();

vi.mock("@repo/services/relationship-type-service", () => ({
  listRelationshipCategories: vi.fn().mockResolvedValue([]),
  fetchRelationshipVocabulary: vi.fn().mockResolvedValue(new Map()),
  createRelationshipCategory: (...a: unknown[]) =>
    createRelationshipCategory(...a),
  updateRelationshipCategory: (...a: unknown[]) =>
    updateRelationshipCategory(...a),
  deleteRelationshipCategory: (...a: unknown[]) =>
    deleteRelationshipCategory(...a),
  createRelationshipType: vi.fn(),
  updateRelationshipType: vi.fn(),
  deleteRelationshipType: vi.fn(),
  createRelationshipRole: vi.fn(),
  updateRelationshipRole: vi.fn(),
  deleteRelationshipRole: vi.fn(),
  countRelationshipTypeUsage: vi.fn().mockResolvedValue(0),
  countRelationshipRoleUsage: vi.fn().mockResolvedValue(0),
  countRelationshipTypeInverseReferences: vi.fn().mockResolvedValue(0),
  countRelationshipRoleInverseReferences: vi.fn().mockResolvedValue(0),
}));

const { CategoryInspector } = await import("./category-inspector");

const CLIENT = {} as never;

const FAMILY: RelationshipCategoryMeta = {
  key: "family",
  label: "Family",
  description: "Kinship relationships.",
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
      roles: [],
    },
    {
      key: "sibling",
      label: "Sibling",
      category_key: "family",
      sort_order: 20,
      is_symmetric: true,
      inverse_key: null,
      direction_verb: null,
      symmetric_noun: "siblings",
      description: null,
      is_active: true,
      roles: [],
    },
  ],
};

function renderInspector(
  props: Partial<React.ComponentProps<typeof CategoryInspector>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryInspector
        client={CLIENT}
        defaultSortOrder={30}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
        onCancel={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CategoryInspector — key immutability", () => {
  it("allows editing the key when creating", () => {
    renderInspector();
    expect(screen.getByLabelText("Key")).toBeEnabled();
  });

  it("disables the key when editing", () => {
    renderInspector({ category: FAMILY });
    const key = screen.getByLabelText("Key");
    expect(key).toBeDisabled();
    expect(key).toHaveValue("family");
  });
});

describe("CategoryInspector — validation and saving", () => {
  it("requires a label", async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.type(screen.getByLabelText("Key"), "professional");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Label is required.")).toBeInTheDocument();
    expect(createRelationshipCategory).not.toHaveBeenCalled();
  });

  it("creates a category", async () => {
    const user = userEvent.setup();
    createRelationshipCategory.mockResolvedValue({
      key: "professional",
      label: "Professional",
    });
    renderInspector();

    await user.type(screen.getByLabelText("Key"), "professional");
    await user.type(screen.getByLabelText("Label"), "Professional");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(createRelationshipCategory).toHaveBeenCalledWith(
        CLIENT,
        expect.objectContaining({ key: "professional", label: "Professional" }),
      ),
    );
  });

  it("sends an update patch without a key", async () => {
    const user = userEvent.setup();
    updateRelationshipCategory.mockResolvedValue(FAMILY);
    renderInspector({ category: FAMILY });

    await user.clear(screen.getByLabelText("Label"));
    await user.type(screen.getByLabelText("Label"), "Kinship");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateRelationshipCategory).toHaveBeenCalled());
    expect(updateRelationshipCategory.mock.calls[0]?.[1]).toBe("family");
    expect(updateRelationshipCategory.mock.calls[0]?.[2]).not.toHaveProperty(
      "key",
    );
  });

  it("surfaces a service error inline", async () => {
    const user = userEvent.setup();
    updateRelationshipCategory.mockRejectedValue(
      new Error("Something went wrong."),
    );
    renderInspector({ category: FAMILY });

    // An unchanged form no-ops on Save (nothing dirty to send) — edit
    // something so the update path actually runs.
    await user.type(screen.getByLabelText("Label"), "!");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Couldn’t save")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("no-ops without a network call when Save is clicked with nothing changed", async () => {
    const user = userEvent.setup();
    renderInspector({ category: FAMILY });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRelationshipCategory).not.toHaveBeenCalled();
  });
});

describe("CategoryInspector — deactivation guard rail", () => {
  it("disables the Active switch in edit mode", () => {
    renderInspector({ category: FAMILY });
    expect(screen.getByRole("switch", { name: "Active" })).toBeDisabled();
  });

  it("leaves the Active switch editable while creating", () => {
    renderInspector();
    expect(screen.getByRole("switch", { name: "Active" })).toBeEnabled();
  });

  it("names the affected types in the deactivate confirmation, not just the count", async () => {
    const user = userEvent.setup();
    renderInspector({ category: FAMILY });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Deactivate" }));

    expect(
      await screen.findByText(/All 2 types in this group will disappear/),
    ).toBeInTheDocument();
    expect(screen.getByText("Parent / Child, Sibling")).toBeInTheDocument();
  });

  it("titles a failed deactivation distinctly from a failed save", async () => {
    const user = userEvent.setup();
    updateRelationshipCategory.mockRejectedValue(new Error("Nope."));
    renderInspector({ category: FAMILY });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Deactivate" }));
    await user.click(await screen.findByRole("button", { name: "Deactivate" }));

    expect(await screen.findByText("Couldn’t deactivate")).toBeInTheDocument();
  });
});

describe("CategoryInspector — delete guard rail", () => {
  it("uses the tree's own type count, with no extra query", async () => {
    const user = userEvent.setup();
    renderInspector({ category: FAMILY });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Delete permanently…" }),
    );

    expect(
      await screen.findByText(
        /2 relationship types use this group, so it can’t be deleted/,
      ),
    ).toBeInTheDocument();
  });

  it("offers deletion for an empty category", async () => {
    const user = userEvent.setup();
    const EMPTY = { ...FAMILY, types: [] };
    renderInspector({ category: EMPTY });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Delete permanently…" }),
    );

    expect(
      await screen.findByRole("button", { name: "Delete permanently" }),
    ).toBeEnabled();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  RelationshipRoleMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

const createRelationshipRole = vi.fn();
const updateRelationshipRole = vi.fn();
const deleteRelationshipRole = vi.fn();
const countRelationshipRoleUsage = vi.fn().mockResolvedValue(0);

vi.mock("@repo/services/relationship-type-service", () => ({
  listRelationshipCategories: vi.fn().mockResolvedValue([]),
  fetchRelationshipVocabulary: vi.fn().mockResolvedValue(new Map()),
  createRelationshipCategory: vi.fn(),
  updateRelationshipCategory: vi.fn(),
  deleteRelationshipCategory: vi.fn(),
  createRelationshipType: vi.fn(),
  updateRelationshipType: vi.fn(),
  deleteRelationshipType: vi.fn(),
  createRelationshipRole: (...a: unknown[]) => createRelationshipRole(...a),
  updateRelationshipRole: (...a: unknown[]) => updateRelationshipRole(...a),
  deleteRelationshipRole: (...a: unknown[]) => deleteRelationshipRole(...a),
  countRelationshipTypeUsage: vi.fn().mockResolvedValue(0),
  countRelationshipRoleUsage: (...a: unknown[]) =>
    countRelationshipRoleUsage(...a),
  countRelationshipTypeInverseReferences: vi.fn().mockResolvedValue(0),
  countRelationshipRoleInverseReferences: vi.fn().mockResolvedValue(0),
}));

const { RoleInspector } = await import("./role-inspector");

const CLIENT = {} as never;

const PARENT: RelationshipRoleMeta = {
  type_key: "parent_child",
  key: "parent",
  label: "Parent",
  inverse_key: "child",
  sort_order: 10,
  is_active: true,
};

const CHILD: RelationshipRoleMeta = {
  type_key: "parent_child",
  key: "child",
  label: "Child",
  inverse_key: "parent",
  sort_order: 20,
  is_active: true,
};

const PARENT_CHILD: RelationshipTypeMeta = {
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
  roles: [PARENT, CHILD],
};

function renderInspector(
  props: Partial<React.ComponentProps<typeof RoleInspector>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RoleInspector
        client={CLIENT}
        parentType={PARENT_CHILD}
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
  countRelationshipRoleUsage.mockResolvedValue(0);
});

describe("RoleInspector — key immutability", () => {
  it("allows editing the key when creating", () => {
    renderInspector();
    expect(screen.getByLabelText("Key")).toBeEnabled();
  });

  it("disables the key when editing", () => {
    renderInspector({ role: PARENT });
    expect(screen.getByLabelText("Key")).toBeDisabled();
  });
});

describe("RoleInspector — inverse sub-role picker", () => {
  it("offers every sibling role except itself", async () => {
    const user = userEvent.setup();
    renderInspector({ role: PARENT });

    await user.click(screen.getByLabelText("Inverse sub-role"));
    expect(screen.getByRole("option", { name: "Child" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Parent" }),
    ).not.toBeInTheDocument();
  });

  it("hydrates the current inverse from the role", () => {
    renderInspector({ role: PARENT });
    expect(screen.getByLabelText("Inverse sub-role")).toHaveTextContent(
      "Child",
    );
  });

  it("defaults to None for a role with no inverse", () => {
    renderInspector({
      role: { ...PARENT, inverse_key: null },
    });
    expect(screen.getByLabelText("Inverse sub-role")).toHaveTextContent("None");
  });

  it("shows a self-inverse role as symmetric, not as None", async () => {
    // `inverse_key = key` is how a symmetric sub-role is written (spouse ↔
    // spouse) and 16 of the 32 roles 00030 seeds use it. Rendering that as the
    // "None" placeholder misreports the row, and re-saving from that state
    // would write NULL and break the involution 00030's pgTAP asserts.
    renderInspector({ role: { ...PARENT, inverse_key: "parent" } });
    expect(screen.getByLabelText("Inverse sub-role")).toHaveTextContent(
      "Itself — symmetric",
    );
  });

  it("round-trips a self-inverse role untouched", async () => {
    const user = userEvent.setup();
    updateRelationshipRole.mockResolvedValue({
      ...PARENT,
      inverse_key: "parent",
    });
    renderInspector({ role: { ...PARENT, inverse_key: "parent" } });

    await user.clear(screen.getByLabelText("Label"));
    await user.type(screen.getByLabelText("Label"), "Parent or guardian");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateRelationshipRole).toHaveBeenCalled());
    // The picker was never touched, so the patch must not mention inverse_key
    // at all — resending it would be harmless, clearing it would not.
    expect(updateRelationshipRole.mock.calls[0]?.[3]).toEqual({
      label: "Parent or guardian",
    });
  });

  it("writes a new symmetric sub-role's own key as its inverse", async () => {
    const user = userEvent.setup();
    createRelationshipRole.mockResolvedValue({
      ...PARENT,
      key: "twin",
      label: "Twin",
      inverse_key: "twin",
    });
    renderInspector();

    await user.type(screen.getByLabelText("Key"), "twin");
    await user.type(screen.getByLabelText("Label"), "Twin");
    await user.click(screen.getByLabelText("Inverse sub-role"));
    await user.click(
      screen.getByRole("option", { name: "Itself — symmetric" }),
    );
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createRelationshipRole).toHaveBeenCalled());
    // The sentinel resolves to the key the user just typed — a symmetric
    // sub-role is authorable in one pass, not create-then-edit.
    expect(createRelationshipRole.mock.calls[0]?.[1]).toMatchObject({
      key: "twin",
      inverse_key: "twin",
    });
  });
});

describe("RoleInspector — validation and saving", () => {
  it("requires a label", async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.type(screen.getByLabelText("Key"), "grandparent");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Label is required.")).toBeInTheDocument();
    expect(createRelationshipRole).not.toHaveBeenCalled();
  });

  it("creates a role scoped to the parent type", async () => {
    const user = userEvent.setup();
    createRelationshipRole.mockResolvedValue({
      key: "grandparent",
      label: "Grandparent",
    });
    renderInspector();

    await user.type(screen.getByLabelText("Key"), "grandparent");
    await user.type(screen.getByLabelText("Label"), "Grandparent");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(createRelationshipRole).toHaveBeenCalledWith(
        CLIENT,
        expect.objectContaining({
          type_key: "parent_child",
          key: "grandparent",
        }),
      ),
    );
  });

  it("sends an update patch keyed by both halves of the composite key", async () => {
    const user = userEvent.setup();
    updateRelationshipRole.mockResolvedValue(PARENT);
    renderInspector({ role: PARENT });

    await user.clear(screen.getByLabelText("Label"));
    await user.type(screen.getByLabelText("Label"), "Mother/Father");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateRelationshipRole).toHaveBeenCalled());
    // updateRelationshipRole(client, typeKey, key, patch)
    expect(updateRelationshipRole.mock.calls[0]?.[1]).toBe("parent_child");
    expect(updateRelationshipRole.mock.calls[0]?.[2]).toBe("parent");
  });

  it("surfaces a service error inline", async () => {
    const user = userEvent.setup();
    updateRelationshipRole.mockRejectedValue(new Error("Nope."));
    renderInspector({ role: PARENT });

    // An unchanged form no-ops on Save (nothing dirty to send) — edit
    // something so the update path actually runs.
    await user.type(screen.getByLabelText("Label"), "!");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Nope.")).toBeInTheDocument();
  });

  it("no-ops without a network call when Save is clicked with nothing changed", async () => {
    const user = userEvent.setup();
    renderInspector({ role: PARENT });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRelationshipRole).not.toHaveBeenCalled();
  });
});

describe("RoleInspector — deactivation guard rail", () => {
  it("disables the Active switch in edit mode", () => {
    renderInspector({ role: PARENT });
    expect(screen.getByRole("switch", { name: "Active" })).toBeDisabled();
  });

  it("leaves the Active switch editable while creating", () => {
    renderInspector();
    expect(screen.getByRole("switch", { name: "Active" })).toBeEnabled();
  });
});

describe("RoleInspector — destructive actions", () => {
  it("makes deactivation the first destructive option", async () => {
    const user = userEvent.setup();
    renderInspector({ role: PARENT });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items[0]).toBe("Deactivate");
    expect(items[1]).toBe("Delete permanently…");
  });

  it("only counts usage once a dialog that shows it is open", async () => {
    const user = userEvent.setup();
    renderInspector({ role: PARENT });

    expect(countRelationshipRoleUsage).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Delete permanently…" }),
    );

    await waitFor(() =>
      expect(countRelationshipRoleUsage).toHaveBeenCalledWith(
        CLIENT,
        "parent_child",
        "parent",
      ),
    );
  });

  it("titles a failed delete distinctly from a failed save", async () => {
    const user = userEvent.setup();
    countRelationshipRoleUsage.mockResolvedValue(0);
    deleteRelationshipRole.mockRejectedValue(new Error("Still in use."));
    renderInspector({ role: PARENT });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Delete permanently…" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Delete permanently" }),
    );

    expect(await screen.findByText("Couldn’t delete")).toBeInTheDocument();
  });
});

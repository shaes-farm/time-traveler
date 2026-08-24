import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  RelationshipCategoryMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

const createRelationshipType = vi.fn();
const updateRelationshipType = vi.fn();
const deleteRelationshipType = vi.fn();
const countRelationshipTypeUsage = vi.fn().mockResolvedValue(0);
const countRelationshipTypeInverseReferences = vi.fn().mockResolvedValue(0);

vi.mock("@repo/services/relationship-type-service", () => ({
  listRelationshipCategories: vi.fn().mockResolvedValue([]),
  fetchRelationshipVocabulary: vi.fn().mockResolvedValue(new Map()),
  createRelationshipType: (...a: unknown[]) => createRelationshipType(...a),
  updateRelationshipType: (...a: unknown[]) => updateRelationshipType(...a),
  deleteRelationshipType: (...a: unknown[]) => deleteRelationshipType(...a),
  createRelationshipCategory: vi.fn(),
  updateRelationshipCategory: vi.fn(),
  deleteRelationshipCategory: vi.fn(),
  createRelationshipRole: vi.fn(),
  updateRelationshipRole: vi.fn(),
  deleteRelationshipRole: vi.fn(),
  countRelationshipTypeUsage: (...a: unknown[]) =>
    countRelationshipTypeUsage(...a),
  countRelationshipRoleUsage: vi.fn().mockResolvedValue(0),
  countRelationshipTypeInverseReferences: (...a: unknown[]) =>
    countRelationshipTypeInverseReferences(...a),
  countRelationshipRoleInverseReferences: vi.fn().mockResolvedValue(0),
}));

const { TypeInspector } = await import("./type-inspector");

const CLIENT = {} as never;

const MENTOR: RelationshipTypeMeta = {
  key: "mentor_student",
  label: "Mentor / Student",
  category_key: "professional",
  sort_order: 10,
  is_symmetric: false,
  inverse_key: null,
  direction_verb: "mentors",
  symmetric_noun: null,
  description: null,
  is_active: true,
  roles: [],
};

const FRIENDSHIP: RelationshipTypeMeta = {
  ...MENTOR,
  key: "friendship",
  label: "Friendship",
  category_key: "social",
  is_symmetric: true,
  direction_verb: null,
  symmetric_noun: "friends",
};

const CATEGORIES: RelationshipCategoryMeta[] = [
  {
    key: "professional",
    label: "Professional",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [MENTOR],
  },
  {
    key: "social",
    label: "Social",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [FRIENDSHIP],
  },
];

function renderInspector(
  props: Partial<React.ComponentProps<typeof TypeInspector>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TypeInspector
        client={CLIENT}
        categories={CATEGORIES}
        defaultCategoryKey="professional"
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
  countRelationshipTypeUsage.mockResolvedValue(0);
  countRelationshipTypeInverseReferences.mockResolvedValue(0);
});

describe("TypeInspector — key immutability", () => {
  it("allows editing the key when creating", () => {
    renderInspector();
    expect(screen.getByLabelText("Key")).toBeEnabled();
  });

  it("disables the key when editing and says why", () => {
    // The FKs are ON UPDATE CASCADE — a rename here would silently rewrite
    // relationship_type on every referencing row (ADR-0041).
    renderInspector({ type: MENTOR });

    const key = screen.getByLabelText("Key");
    expect(key).toBeDisabled();
    expect(key).toHaveValue("mentor_student");
    expect(screen.getByText(/Keys are permanent/)).toBeInTheDocument();
  });
});

describe("TypeInspector — the symmetry invariant is unreachable", () => {
  it("offers the three legal states as one choice", () => {
    renderInspector();
    expect(
      screen.getByRole("radio", { name: /Symmetric/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Directed, with an inverse/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Directed, no reciprocal/ }),
    ).toBeInTheDocument();
  });

  it("hides the inverse picker unless the mode uses one", async () => {
    // With no way to set an inverse while symmetric, the combination the CHECK
    // rejects cannot be expressed.
    const user = userEvent.setup();
    renderInspector();

    expect(screen.queryByLabelText("Inverse type")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("radio", { name: /Directed, with an inverse/ }),
    );
    expect(await screen.findByLabelText("Inverse type")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /^Symmetric/ }));
    await waitFor(() =>
      expect(screen.queryByLabelText("Inverse type")).not.toBeInTheDocument(),
    );
  });

  it("swaps the noun and verb fields with the mode", async () => {
    const user = userEvent.setup();
    renderInspector();

    expect(screen.getByLabelText("Noun")).toBeInTheDocument();
    expect(screen.queryByLabelText("Verb")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("radio", { name: /Directed, no reciprocal/ }),
    );

    expect(await screen.findByLabelText("Verb")).toBeInTheDocument();
    expect(screen.queryByLabelText("Noun")).not.toBeInTheDocument();
  });

  it("never submits a symmetric type carrying an inverse", async () => {
    const user = userEvent.setup();
    createRelationshipType.mockResolvedValue({ key: "x", label: "X" });
    renderInspector();

    // Pick an inverse, then change your mind and go symmetric.
    await user.click(
      screen.getByRole("radio", { name: /Directed, with an inverse/ }),
    );
    await user.type(screen.getByLabelText("Verb"), "mentors");
    await user.click(screen.getByRole("radio", { name: /^Symmetric/ }));

    await user.type(screen.getByLabelText("Key"), "companionship");
    await user.type(screen.getByLabelText("Label"), "Companionship");
    await user.type(await screen.findByLabelText("Noun"), "companions");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createRelationshipType).toHaveBeenCalled());
    const payload = createRelationshipType.mock.calls[0]?.[1] as {
      is_symmetric: boolean;
      inverse_key: string | null;
    };
    expect(payload.is_symmetric).toBe(true);
    expect(payload.inverse_key).toBeNull();
  });

  it("hydrates the mode from an existing symmetric type", () => {
    renderInspector({ type: FRIENDSHIP });
    expect(screen.getByRole("radio", { name: /^Symmetric/ })).toBeChecked();
    expect(screen.getByLabelText("Noun")).toHaveValue("friends");
  });

  it("hydrates the mode from an existing directed type", () => {
    renderInspector({ type: MENTOR });
    expect(
      screen.getByRole("radio", { name: /Directed, no reciprocal/ }),
    ).toBeChecked();
    expect(screen.getByLabelText("Verb")).toHaveValue("mentors");
  });
});

describe("TypeInspector — validation and saving", () => {
  it("requires a noun for a symmetric type", async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.type(screen.getByLabelText("Key"), "companionship");
    await user.type(screen.getByLabelText("Label"), "Companionship");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText(/A symmetric type needs a noun/),
    ).toBeInTheDocument();
    expect(createRelationshipType).not.toHaveBeenCalled();
  });

  it("surfaces a service error inline rather than only as a toast", async () => {
    const user = userEvent.setup();
    updateRelationshipType.mockRejectedValue(
      new Error("Relationships still use this type."),
    );
    renderInspector({ type: FRIENDSHIP });

    await user.clear(screen.getByLabelText("Label"));
    await user.type(screen.getByLabelText("Label"), "Friends");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Relationships still use this type."),
    ).toBeInTheDocument();
  });

  it("sends an update patch without a key", async () => {
    const user = userEvent.setup();
    updateRelationshipType.mockResolvedValue(FRIENDSHIP);
    renderInspector({ type: FRIENDSHIP });

    await user.clear(screen.getByLabelText("Label"));
    await user.type(screen.getByLabelText("Label"), "Friends");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateRelationshipType).toHaveBeenCalled());
    expect(updateRelationshipType.mock.calls[0]?.[1]).toBe("friendship");
    expect(updateRelationshipType.mock.calls[0]?.[2]).not.toHaveProperty("key");
  });
});

describe("TypeInspector — destructive actions", () => {
  it("hides the overflow menu while creating", () => {
    renderInspector();
    expect(
      screen.queryByRole("button", { name: "More actions" }),
    ).not.toBeInTheDocument();
  });

  it("makes deactivation the first destructive option", async () => {
    const user = userEvent.setup();
    renderInspector({ type: MENTOR });

    await user.click(screen.getByRole("button", { name: "More actions" }));

    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items[0]).toBe("Deactivate");
    expect(items[1]).toBe("Delete permanently…");
  });

  it("offers reactivation for an inactive type", async () => {
    const user = userEvent.setup();
    renderInspector({ type: { ...MENTOR, is_active: false } });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getByRole("menuitem", { name: "Reactivate" }),
    ).toBeInTheDocument();
  });

  it("only counts usage once a dialog that shows it is open", async () => {
    const user = userEvent.setup();
    renderInspector({ type: MENTOR });

    expect(countRelationshipTypeUsage).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Delete permanently…" }),
    );

    await waitFor(() =>
      expect(countRelationshipTypeUsage).toHaveBeenCalledWith(
        CLIENT,
        "mentor_student",
      ),
    );
  });

  it("keeps delete disabled while the inverse-reference check is still pending, even after usage resolves", async () => {
    // Usage resolving must not be enough on its own — the informational
    // inverse-reference warning has to have a chance to load too, or an
    // admin could delete before ever seeing it.
    let resolveInverseRefs!: (value: number) => void;
    countRelationshipTypeInverseReferences.mockReturnValue(
      new Promise((resolve) => {
        resolveInverseRefs = resolve;
      }),
    );
    const user = userEvent.setup();
    renderInspector({ type: MENTOR });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Delete permanently…" }),
    );

    await waitFor(() => expect(countRelationshipTypeUsage).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeDisabled();

    resolveInverseRefs(0);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Delete permanently" }),
      ).toBeEnabled(),
    );
  });

  it("disables the Active switch in edit mode — deactivation only goes through the dialog", () => {
    // Saving is_active directly would flip it without ever showing the
    // blast-radius warning DeactivateDialog exists to surface.
    renderInspector({ type: MENTOR });
    expect(screen.getByRole("switch", { name: "Active" })).toBeDisabled();
  });

  it("leaves the Active switch editable while creating", () => {
    renderInspector();
    expect(screen.getByRole("switch", { name: "Active" })).toBeEnabled();
  });

  it("titles the error alert for the failing action, not always 'save'", async () => {
    const user = userEvent.setup();
    deleteRelationshipType.mockRejectedValue(new Error("Still in use."));
    renderInspector({ type: MENTOR });

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

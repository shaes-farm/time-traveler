import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";

const listRelationshipCategories = vi.fn();
const updateRelationshipCategory = vi.fn();
const updateRelationshipType = vi.fn();

vi.mock("@repo/services/relationship-type-service", () => ({
  listRelationshipCategories: (...a: unknown[]) =>
    listRelationshipCategories(...a),
  fetchRelationshipVocabulary: vi.fn().mockResolvedValue(new Map()),
  createRelationshipCategory: vi.fn(),
  updateRelationshipCategory: (...a: unknown[]) =>
    updateRelationshipCategory(...a),
  deleteRelationshipCategory: vi.fn(),
  createRelationshipType: vi.fn(),
  updateRelationshipType: (...a: unknown[]) => updateRelationshipType(...a),
  deleteRelationshipType: vi.fn(),
  createRelationshipRole: vi.fn(),
  updateRelationshipRole: vi.fn(),
  deleteRelationshipRole: vi.fn(),
  countRelationshipTypeUsage: vi.fn().mockResolvedValue(0),
  countRelationshipRoleUsage: vi.fn().mockResolvedValue(0),
  countRelationshipTypeInverseReferences: vi.fn().mockResolvedValue(0),
  countRelationshipRoleInverseReferences: vi.fn().mockResolvedValue(0),
  bySortOrderThenLabel: (
    a: { sort_order: number; label: string },
    b: { sort_order: number; label: string },
  ) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
}));

vi.mock("../../../../../lib/auth/browser-client", () => ({
  getBrowserSupabaseClient: () => ({}),
}));

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const { VocabularyManagerShell } = await import("./vocabulary-manager-shell");

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
        is_active: false,
        roles: [],
      },
    ],
  },
  {
    key: "professional",
    label: "Professional",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [],
  },
];

function renderShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VocabularyManagerShell />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("VocabularyManagerShell — the four states", () => {
  it("shows skeletons while loading", () => {
    listRelationshipCategories.mockReturnValue(new Promise(() => {}));
    const { container } = renderShell();
    expect(
      container.querySelectorAll('[class*="animate-pulse"]').length,
    ).toBeGreaterThan(0);
  });

  it("shows an empty state with a create affordance", async () => {
    listRelationshipCategories.mockResolvedValue([]);
    renderShell();

    expect(
      await screen.findByText("No relationship vocabulary yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /New group/ }),
    ).toBeInTheDocument();
  });

  it("shows a retryable error", async () => {
    const user = userEvent.setup();
    listRelationshipCategories.mockRejectedValue(
      new Error("permission denied"),
    );
    renderShell();

    expect(
      await screen.findByText("Couldn’t load the vocabulary"),
    ).toBeInTheDocument();
    expect(screen.getByText("permission denied")).toBeInTheDocument();

    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("tree")).toBeInTheDocument();
  });

  it("renders the tree with a summary count", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(await screen.findByRole("tree")).toBeInTheDocument();
    expect(screen.getByText(/2 groups · 2 types/)).toBeInTheDocument();
  });
});

describe("VocabularyManagerShell — reading retired entries", () => {
  it("asks the service for inactive rows too", async () => {
    // This is the one surface where retired vocabulary must stay visible;
    // otherwise deactivating an entry makes it unreachable and unrestorable.
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    await waitFor(() =>
      expect(listRelationshipCategories).toHaveBeenCalledWith(
        expect.anything(),
        { activeOnly: false },
      ),
    );
  });

  it("marks an inactive entry in the tree", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    await screen.findByRole("tree");
    const family = screen.getByRole("treeitem", { name: /Family/ });
    await userEvent.setup().click(within(family).getByLabelText("Expand"));

    const sibling = await screen.findByRole("treeitem", { name: /Sibling/ });
    expect(within(sibling).getByText("Inactive")).toBeInTheDocument();
  });
});

describe("VocabularyManagerShell — selection", () => {
  it("puts the selection in the URL", async () => {
    const user = userEvent.setup();
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    await screen.findByRole("tree");
    await user.click(screen.getByRole("treeitem", { name: /Family/ }));

    expect(replace).toHaveBeenCalledWith(
      "/admin/relationship-vocabulary?level=category&key=family",
    );
  });

  it("prompts to select something when nothing is selected", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();
    expect(
      await screen.findByText(/Select an entry to edit it/),
    ).toBeInTheDocument();
  });

  it("opens the matching inspector from the URL", async () => {
    searchParams = new URLSearchParams({ level: "category", key: "family" });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(
      await screen.findByRole("heading", { name: "Edit group" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Key")).toHaveValue("family");
  });

  it("explains that a sub-role needs a parent type", async () => {
    searchParams = new URLSearchParams({ level: "role" });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(
      await screen.findByText(/Select a relationship type first/),
    ).toBeInTheDocument();
  });
});

describe("VocabularyManagerShell — a stale or mistyped deep link", () => {
  it("shows not-found for a category key that doesn't resolve, not a blank create form", async () => {
    searchParams = new URLSearchParams({ level: "category", key: "ghost" });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(
      await screen.findByText("This group no longer exists."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "New group" }),
    ).not.toBeInTheDocument();
  });

  it("shows not-found for a type key that doesn't resolve", async () => {
    searchParams = new URLSearchParams({ level: "type", key: "ghost" });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(
      await screen.findByText("This relationship type no longer exists."),
    ).toBeInTheDocument();
  });

  it("shows not-found when the role's parent type no longer resolves", async () => {
    searchParams = new URLSearchParams({
      level: "role",
      key: "parent",
      parent: "ghost_type",
    });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(
      await screen.findByText("This relationship type no longer exists."),
    ).toBeInTheDocument();
  });

  it("shows not-found for a role key that doesn't resolve under a real type", async () => {
    searchParams = new URLSearchParams({
      level: "role",
      key: "ghost_role",
      parent: "parent_child",
    });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    expect(
      await screen.findByText("This sub-role no longer exists."),
    ).toBeInTheDocument();
  });

  it("offers a way back from a not-found state", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams({ level: "category", key: "ghost" });
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    await user.click(
      await screen.findByRole("button", { name: "Back to the list" }),
    );
    expect(replace).toHaveBeenCalledWith("/admin/relationship-vocabulary");
  });
});

describe("VocabularyManagerShell — reordering", () => {
  it("swaps sort_order with the adjacent sibling", async () => {
    const user = userEvent.setup();
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    updateRelationshipCategory.mockResolvedValue({});
    renderShell();

    await screen.findByRole("tree");
    await user.click(screen.getByLabelText("Move Professional up"));

    await waitFor(() =>
      expect(updateRelationshipCategory).toHaveBeenCalledTimes(2),
    );
    // Professional (20) takes Family's 10, and Family takes 20.
    expect(updateRelationshipCategory).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "professional",
      { sort_order: 10 },
    );
    expect(updateRelationshipCategory).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "family",
      { sort_order: 20 },
    );
  });

  it("disables the arrows at the list boundaries", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    renderShell();

    await screen.findByRole("tree");
    expect(screen.getByLabelText("Move Family up")).toBeDisabled();
    expect(screen.getByLabelText("Move Professional down")).toBeDisabled();
    expect(screen.getByLabelText("Move Family down")).toBeEnabled();
  });
});

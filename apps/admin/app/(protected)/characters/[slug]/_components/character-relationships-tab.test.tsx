import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toVocabulary } from "@repo/services/schemas/relationship-vocabulary";
import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";
import { CharacterRelationshipsTab } from "./character-relationships-tab";

// ---------------------------------------------------------------------------
// The tab composes two independent queries — the relationships themselves and
// the relationship vocabulary (#419) — and cannot render a card without both:
// grouping and the narrative direction line are read off the vocabulary. These
// tests cover the four loading/error combinations. The add/edit/delete flows
// are exercised by the relationships-editor e2e spec (#387), not here.
// ---------------------------------------------------------------------------

const h = vi.hoisted(() => ({
  relationships: [] as unknown[],
  relPending: false,
  relError: false,
  relRefetch: vi.fn(),
  vocabPending: false,
  vocabError: false,
  vocabRefetch: vi.fn(),
  deleteMutate: vi.fn(),
}));

vi.mock("@repo/ui/hooks/use-character-relationships", () => ({
  useCharacterRelationships: () => ({
    data: h.relationships,
    isPending: h.relPending,
    isError: h.relError,
    refetch: h.relRefetch,
  }),
  useDeleteRelationship: () => ({
    mutate: h.deleteMutate,
    isPending: false,
  }),
}));

vi.mock("@repo/ui/hooks/use-relationship-types", () => ({
  useRelationshipVocabulary: () => ({
    vocabulary: toVocabulary(h.vocabError ? [] : CATEGORIES),
    categories: h.vocabError ? [] : CATEGORIES,
    isPending: h.vocabPending,
    isError: h.vocabError,
    refetch: h.vocabRefetch,
  }),
}));

// The sheet drags in Radix Sheet/Popover/Command and the character service; it
// has its own test file. Stub it so this suite exercises only the tab.
vi.mock("./add-relationship-sheet", () => ({
  AddRelationshipSheet: () => null,
}));

vi.mock("@repo/ui/components/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const CATEGORIES: RelationshipCategoryMeta[] = [
  {
    key: "family",
    label: "Family",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      {
        key: "family",
        label: "Family",
        category_key: "family",
        sort_order: 10,
        is_symmetric: true,
        inverse_key: null,
        direction_verb: null,
        symmetric_noun: "relatives",
        description: null,
        is_active: true,
        roles: [],
      },
    ],
  },
];

const FOCAL_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const OTHER_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

const sampleRelationship = {
  id: "rel-1",
  character_id: FOCAL_ID,
  related_character_id: OTHER_ID,
  relationship_type: "family",
  relationship_role: null,
  description: null,
  start_temporal: null,
  end_temporal: null,
};

/** Answers the tab's inline lookup of the other characters' names. */
const client = {
  from: () => ({
    select: () => ({
      in: () =>
        Promise.resolve({
          data: [
            {
              id: OTHER_ID,
              name: "Pierre Curie",
              slug: "pierre-curie",
              character_type: "human",
            },
          ],
          error: null,
        }),
    }),
  }),
} as never;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderTab() {
  return render(
    <CharacterRelationshipsTab
      client={client}
      characterId={FOCAL_ID}
      characterName="Marie Curie"
      canEdit
    />,
    { wrapper },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.relationships = [sampleRelationship];
  h.relPending = false;
  h.relError = false;
  h.vocabPending = false;
  h.vocabError = false;
});

describe("CharacterRelationshipsTab loading and error states", () => {
  it("shows skeletons while the vocabulary is still loading", () => {
    // Relationships have arrived but the vocabulary has not. Rendering now
    // would file every row under a bare "Other" heading, so the tab waits.
    h.vocabPending = true;
    const { container } = renderTab();

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    expect(screen.queryByText("Family")).not.toBeInTheDocument();
    expect(screen.queryByText(/Relationships \(/)).not.toBeInTheDocument();
  });

  it("shows skeletons while the relationships are still loading", () => {
    h.relPending = true;
    const { container } = renderTab();

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("reports a failed vocabulary fetch instead of mis-grouping the rows", async () => {
    h.vocabError = true;
    renderTab();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to load relationship types.",
    );
    // The rows are withheld rather than rendered under "Other".
    expect(screen.queryByText("Pierre Curie")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(h.vocabRefetch).toHaveBeenCalledTimes(1);
    // Only the query that failed is refired.
    expect(h.relRefetch).not.toHaveBeenCalled();
  });

  it("reports a failed relationships fetch with its own message", async () => {
    h.relError = true;
    renderTab();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to load relationships.",
    );

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(h.relRefetch).toHaveBeenCalledTimes(1);
    expect(h.vocabRefetch).not.toHaveBeenCalled();
  });

  it("renders vocabulary-driven group legends once both queries resolve", async () => {
    renderTab();

    expect(screen.getByText("Relationships (1)")).toBeInTheDocument();
    // The legend comes from relationship_categories.label, not a hard-coded map.
    expect(screen.getByRole("button", { name: /Family/ })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Pierre Curie")).toBeInTheDocument(),
    );
  });

  it("falls back to an Other group for a type absent from the vocabulary", async () => {
    h.relationships = [
      { ...sampleRelationship, relationship_type: "retired_type" },
    ];
    renderTab();

    expect(screen.getByRole("button", { name: /Other/ })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Pierre Curie")).toBeInTheDocument(),
    );
  });
});

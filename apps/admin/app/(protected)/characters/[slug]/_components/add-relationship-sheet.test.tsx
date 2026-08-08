import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";
import { toVocabulary } from "@repo/services/schemas/relationship-vocabulary";
import { AddRelationshipSheet } from "./add-relationship-sheet";

// ---------------------------------------------------------------------------
// The default relationship type comes from the fetched vocabulary (#419), so
// until that query resolves there is no type to save. These tests cover the
// footer's dependence on that state; the full add/edit flow is covered by the
// relationships-editor e2e spec (#387).
// ---------------------------------------------------------------------------

const h = vi.hoisted(() => ({
  vocabPending: false,
  vocabError: false,
  vocabEmpty: false,
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("@repo/ui/hooks/use-relationship-types", () => ({
  useRelationshipVocabulary: () => {
    const categories =
      h.vocabPending || h.vocabError || h.vocabEmpty ? [] : CATEGORIES;
    return {
      vocabulary: toVocabulary(categories),
      categories,
      isPending: h.vocabPending,
      isError: h.vocabError,
      refetch: vi.fn(),
    };
  },
}));

vi.mock("@repo/ui/hooks/use-character-relationships", () => ({
  useCreateRelationship: () => ({ mutate: h.createMutate, isPending: false }),
  useUpdateRelationship: () => ({ mutate: h.updateMutate, isPending: false }),
}));

vi.mock("@repo/services/character-service", () => ({
  getCharacters: () => Promise.resolve({ data: [], count: 0 }),
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

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Rendered with `initialOther` set — the "Duplicate as type" entry point. That
 * is the reachable case: with a character already chosen, handleSave's `!other`
 * guard does not fire, so nothing but the footer's own disabled state stands
 * between a click and a submit carrying an empty relationship_type.
 */
function renderSheet() {
  return render(
    <AddRelationshipSheet
      open
      onClose={vi.fn()}
      client={{} as never}
      focalCharacterId={FOCAL_ID}
      focalCharacterName="Marie Curie"
      existingLinks={[]}
      initialOther={{
        id: OTHER_ID,
        name: "Pierre Curie",
        characterType: "human",
      }}
      onSaved={vi.fn()}
    />,
    { wrapper },
  );
}

const saveButton = () => screen.getByRole("button", { name: "Save" });

beforeEach(() => {
  vi.clearAllMocks();
  h.vocabPending = false;
  h.vocabError = false;
  h.vocabEmpty = false;
});

describe("AddRelationshipSheet save gating", () => {
  it("disables Save while the vocabulary is loading", () => {
    h.vocabPending = true;
    renderSheet();

    expect(saveButton()).toBeDisabled();
  });

  it("disables Save when the vocabulary failed to load", () => {
    h.vocabError = true;
    renderSheet();

    expect(
      screen.getByText("Could not load relationship types. Try again."),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("disables Save when the vocabulary is empty, leaving no default type", () => {
    // Reachable before the baseline seed has run: the query succeeds and
    // returns nothing, so `defaultType` is "" and there is no valid submission.
    h.vocabEmpty = true;
    renderSheet();

    expect(saveButton()).toBeDisabled();
  });

  it("enables Save once the vocabulary supplies a default type", () => {
    renderSheet();

    expect(saveButton()).toBeEnabled();
  });
});

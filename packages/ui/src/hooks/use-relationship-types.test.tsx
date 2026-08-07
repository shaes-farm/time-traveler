import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  relationshipTypeKeys,
  useRelationshipCategories,
  useRelationshipVocabulary,
} from "./use-relationship-types";

const listRelationshipCategories = vi.fn();

vi.mock("@repo/services/relationship-type-service", () => ({
  listRelationshipCategories: (
    ...args: Parameters<typeof listRelationshipCategories>
  ) => listRelationshipCategories(...args),
  fetchRelationshipVocabulary: vi.fn(),
}));

const CATEGORIES = [
  {
    key: "social",
    label: "Social",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      {
        key: "friendship",
        label: "Friendship",
        category_key: "social",
        sort_order: 10,
        is_symmetric: true,
        inverse_key: null,
        direction_verb: null,
        symmetric_noun: "friends",
        description: null,
        is_active: true,
        roles: [],
      },
    ],
  },
];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const fakeClient = {} as Parameters<typeof useRelationshipCategories>[0];

beforeEach(() => {
  listRelationshipCategories.mockReset();
});

describe("relationshipTypeKeys", () => {
  it("scopes the cache key by activeOnly so admin and editor reads don't collide", () => {
    expect(relationshipTypeKeys.list(true)).not.toEqual(
      relationshipTypeKeys.list(false),
    );
    expect(relationshipTypeKeys.list(true)[0]).toBe("relationship-vocabulary");
  });
});

describe("useRelationshipCategories", () => {
  it("fetches active vocabulary by default", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    const { result } = renderHook(() => useRelationshipCategories(fakeClient), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(CATEGORIES);
    expect(listRelationshipCategories).toHaveBeenCalledWith(fakeClient, {
      activeOnly: true,
    });
  });

  it("passes activeOnly:false through for admin management", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    const { result } = renderHook(
      () => useRelationshipCategories(fakeClient, { activeOnly: false }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listRelationshipCategories).toHaveBeenCalledWith(fakeClient, {
      activeOnly: false,
    });
  });
});

describe("useRelationshipVocabulary", () => {
  it("exposes a key → metadata lookup derived from the tree", async () => {
    listRelationshipCategories.mockResolvedValue(CATEGORIES);
    const { result } = renderHook(() => useRelationshipVocabulary(fakeClient), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.categories).toEqual(CATEGORIES);
    expect(result.current.vocabulary.get("friendship")?.symmetric_noun).toBe(
      "friends",
    );
  });

  it("yields an empty vocabulary before the baseline seed has run", async () => {
    listRelationshipCategories.mockResolvedValue([]);
    const { result } = renderHook(() => useRelationshipVocabulary(fakeClient), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.vocabulary.size).toBe(0);
    expect(result.current.categories).toEqual([]);
  });

  it("surfaces a fetch failure rather than pretending the vocabulary is empty", async () => {
    listRelationshipCategories.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useRelationshipVocabulary(fakeClient), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.vocabulary.size).toBe(0);
  });
});

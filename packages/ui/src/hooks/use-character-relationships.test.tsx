import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useCharacterRelationships,
  useRelationship,
  useSharedEvents,
  useCharacterNetworkGraph,
  useMutualRelationships,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  relationshipKeys,
} from "./use-character-relationships.js";

vi.mock("@repo/services/character-relationship-service.js", () => ({
  getRelationships: vi.fn(),
  getRelationshipById: vi.fn(),
  createRelationship: vi.fn(),
  updateRelationship: vi.fn(),
  deleteRelationship: vi.fn(),
  getSharedEvents: vi.fn(),
  getCharacterNetwork: vi.fn(),
  getMutualRelationships: vi.fn(),
}));

import {
  getRelationships,
  getRelationshipById,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getSharedEvents,
  getCharacterNetwork,
  getMutualRelationships,
} from "@repo/services/character-relationship-service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockClient = {} as any;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const mockRelationship = {
  id: "rel-1",
  character_id: "char-1",
  related_character_id: "char-2",
  relationship_type: "ally",
};
const mockRelationships = [mockRelationship];

describe("useCharacterRelationships", () => {
  beforeEach(() => {
    vi.mocked(getRelationships).mockResolvedValue(mockRelationships as never);
  });

  it("calls getRelationships with client, characterId, and filters", async () => {
    const filters = { relationshipType: "ally" as never };
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCharacterRelationships(mockClient, "char-1", filters),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRelationships).toHaveBeenCalledWith(
      mockClient,
      "char-1",
      filters,
    );
    expect(result.current.data).toEqual(mockRelationships);
  });
});

describe("useRelationship", () => {
  it("calls getRelationshipById with client and id", async () => {
    vi.mocked(getRelationshipById).mockResolvedValue(mockRelationship as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRelationship(mockClient, "rel-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRelationshipById).toHaveBeenCalledWith(mockClient, "rel-1");
  });
});

describe("useSharedEvents", () => {
  it("calls getSharedEvents with client and both character IDs", async () => {
    vi.mocked(getSharedEvents).mockResolvedValue([] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSharedEvents(mockClient, "char-1", "char-2"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSharedEvents).toHaveBeenCalledWith(
      mockClient,
      "char-1",
      "char-2",
    );
  });
});

describe("useCharacterNetworkGraph", () => {
  it("calls getCharacterNetwork with client, id, and depth", async () => {
    vi.mocked(getCharacterNetwork).mockResolvedValue([] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCharacterNetworkGraph(mockClient, "char-1", 3),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCharacterNetwork).toHaveBeenCalledWith(mockClient, "char-1", 3);
  });
});

describe("useMutualRelationships", () => {
  it("calls getMutualRelationships with client and both character IDs", async () => {
    vi.mocked(getMutualRelationships).mockResolvedValue([] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useMutualRelationships(mockClient, "char-1", "char-2"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMutualRelationships).toHaveBeenCalledWith(
      mockClient,
      "char-1",
      "char-2",
    );
  });
});

describe("useCreateRelationship", () => {
  it("calls createRelationship and invalidates list cache", async () => {
    vi.mocked(createRelationship).mockResolvedValue(mockRelationship as never);
    vi.mocked(getRelationships).mockResolvedValue(mockRelationships as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateRelationship(mockClient), {
      wrapper,
    });

    result.current.mutate({
      character_id: "char-1",
      related_character_id: "char-2",
      relationship_type: "ally",
    } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createRelationship).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: relationshipKeys.lists() }),
    );
  });
});

describe("useUpdateRelationship", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updateRelationship).mockRejectedValue(new Error("fail"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      relationshipKeys.detail("rel-1"),
      mockRelationship,
    );

    const { result } = renderHook(() => useUpdateRelationship(mockClient), {
      wrapper,
    });
    result.current.mutate({
      id: "rel-1",
      data: { relationship_type: "enemy" as never },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(relationshipKeys.detail("rel-1"))).toEqual(
      mockRelationship,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateRelationship).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateRelationship(mockClient), {
      wrapper,
    });
    result.current.mutate({
      id: "rel-1",
      data: { relationship_type: "enemy" as never },
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteRelationship", () => {
  it("calls deleteRelationship and removes from cache", async () => {
    vi.mocked(deleteRelationship).mockResolvedValue(undefined as never);
    vi.mocked(getRelationships).mockResolvedValue(mockRelationships as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      relationshipKeys.detail("rel-1"),
      mockRelationship,
    );
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteRelationship(mockClient), {
      wrapper,
    });
    result.current.mutate("rel-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteRelationship).toHaveBeenCalledWith(mockClient, "rel-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: relationshipKeys.detail("rel-1"),
      }),
    );
  });
});

describe("relationshipKeys", () => {
  it("produces stable, unique keys", () => {
    expect(relationshipKeys.all).toEqual(["relationships"]);
    expect(relationshipKeys.lists()).toEqual(["relationships", "list"]);
    expect(
      relationshipKeys.list("char-1", { relationshipType: "ally" as never }),
    ).toEqual([
      "relationships",
      "list",
      "char-1",
      { relationshipType: "ally" },
    ]);
    expect(relationshipKeys.network("char-1", 2)).toEqual([
      "relationships",
      "network",
      "char-1",
      2,
    ]);
  });
});

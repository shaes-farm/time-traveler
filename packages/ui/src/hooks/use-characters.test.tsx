import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useCharacters,
  useCharacter,
  useCreateCharacter,
  useUpdateCharacter,
  useAutosaveCharacter,
  useDeleteCharacter,
  useCharacterTimeline,
  useCharacterNetwork,
  useAddMediaToCharacter,
  useRemoveMediaFromCharacter,
  useSetPrimaryCharacterMedia,
  characterKeys,
  characterMutationKeys,
} from "./use-characters";

// ---------------------------------------------------------------------------
// Mock the character service
// ---------------------------------------------------------------------------

vi.mock("@repo/services/character-service", () => ({
  getCharacters: vi.fn(),
  getCharacterById: vi.fn(),
  getCharacterBySlug: vi.fn(),
  createCharacter: vi.fn(),
  updateCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  getCharacterTimeline: vi.fn(),
  getCharacterNetwork: vi.fn(),
  addMediaToCharacter: vi.fn(),
  removeMediaFromCharacter: vi.fn(),
  setPrimaryCharacterMedia: vi.fn(),
}));

import {
  getCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacterTimeline,
  getCharacterNetwork,
  addMediaToCharacter,
  removeMediaFromCharacter,
  setPrimaryCharacterMedia,
} from "@repo/services/character-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal mock Supabase client — service functions are mocked so it's never called. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockClient = {} as any;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const mockCharacter = {
  id: "char-1",
  slug: "aragorn",
  character_type: "Human" as const,
  user_id: "user-1",
};

const mockCharacters = [mockCharacter];

const mockCharacterWithMedia = {
  ...mockCharacter,
  character_media: [
    { character_id: "char-1", media_id: "media-1", is_primary: true },
    { character_id: "char-1", media_id: "media-2", is_primary: false },
  ],
};

// ---------------------------------------------------------------------------
// useCharacters
// ---------------------------------------------------------------------------

describe("useCharacters", () => {
  beforeEach(() => {
    vi.mocked(getCharacters).mockResolvedValue(mockCharacters as never);
  });

  it("calls getCharacters with the client and filters", async () => {
    const filters = { characterType: "human" as const };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCharacters(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getCharacters).toHaveBeenCalledWith(mockClient, filters);
    expect(result.current.data).toEqual(mockCharacters);
  });

  it("uses the correct query key", async () => {
    const filters = { page: 2 };
    const { wrapper, queryClient } = createWrapper();
    renderHook(() => useCharacters(mockClient, filters), { wrapper });

    await waitFor(
      () =>
        queryClient.getQueryState(characterKeys.list(filters))?.status ===
        "success",
    );

    expect(queryClient.getQueryData(characterKeys.list(filters))).toEqual(
      mockCharacters,
    );
  });
});

// ---------------------------------------------------------------------------
// useCharacter
// ---------------------------------------------------------------------------

describe("useCharacter", () => {
  beforeEach(() => {
    vi.mocked(getCharacterById).mockResolvedValue(mockCharacter as never);
  });

  it("calls getCharacterById with the client and id", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCharacter(mockClient, "char-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getCharacterById).toHaveBeenCalledWith(mockClient, "char-1");
    expect(result.current.data).toEqual(mockCharacter);
  });
});

// ---------------------------------------------------------------------------
// useCharacterTimeline
// ---------------------------------------------------------------------------

describe("useCharacterTimeline", () => {
  it("calls getCharacterTimeline with the client and characterId", async () => {
    const mockTimeline = [{ id: "evt-1" }];
    vi.mocked(getCharacterTimeline).mockResolvedValue(mockTimeline as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCharacterTimeline(mockClient, "char-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getCharacterTimeline).toHaveBeenCalledWith(mockClient, "char-1");
    expect(result.current.data).toEqual(mockTimeline);
  });
});

// ---------------------------------------------------------------------------
// useCharacterNetwork
// ---------------------------------------------------------------------------

describe("useCharacterNetwork", () => {
  it("calls getCharacterNetwork with client, id, and depth", async () => {
    const mockNetwork = [{ from_id: "char-1", to_id: "char-2" }];
    vi.mocked(getCharacterNetwork).mockResolvedValue(mockNetwork as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCharacterNetwork(mockClient, "char-1", 2),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getCharacterNetwork).toHaveBeenCalledWith(mockClient, "char-1", 2);
  });
});

// ---------------------------------------------------------------------------
// useCreateCharacter
// ---------------------------------------------------------------------------

describe("useCreateCharacter", () => {
  it("calls createCharacter and invalidates list cache on success", async () => {
    vi.mocked(createCharacter).mockResolvedValue(mockCharacter as never);
    vi.mocked(getCharacters).mockResolvedValue(mockCharacters as never);

    const { wrapper, queryClient } = createWrapper();

    // Pre-populate the list cache
    queryClient.setQueryData(characterKeys.list({}), mockCharacters);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate({
      title: "Aragorn",
      user_id: "user-1",
    } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createCharacter).toHaveBeenCalledWith(mockClient, {
      title: "Aragorn",
      user_id: "user-1",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.lists() }),
    );
  });
});

// ---------------------------------------------------------------------------
// useUpdateCharacter
// ---------------------------------------------------------------------------

describe("useUpdateCharacter", () => {
  it("calls updateCharacter and invalidates detail + list caches on success", async () => {
    const updated = { ...mockCharacter, slug: "strider" };
    vi.mocked(updateCharacter).mockResolvedValue(updated as never);
    vi.mocked(getCharacters).mockResolvedValue(mockCharacters as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(characterKeys.detail("char-1"), mockCharacter);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate({ id: "char-1", data: { slug: "strider" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateCharacter).toHaveBeenCalledWith(mockClient, "char-1", {
      slug: "strider",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.detail("char-1") }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.lists() }),
    );
  });

  it("rolls back the optimistic update on error", async () => {
    vi.mocked(updateCharacter).mockRejectedValue(new Error("DB error"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(characterKeys.detail("char-1"), mockCharacter);

    const { result } = renderHook(() => useUpdateCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate({ id: "char-1", data: { slug: "bad-slug" } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache should be restored to the original value
    expect(queryClient.getQueryData(characterKeys.detail("char-1"))).toEqual(
      mockCharacter,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateCharacter).mockRejectedValue(new Error("DB error"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCharacter(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "char-1", data: { slug: "bad-slug" } });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useDeleteCharacter
// ---------------------------------------------------------------------------

describe("useDeleteCharacter", () => {
  it("calls deleteCharacter and removes from cache on success", async () => {
    vi.mocked(deleteCharacter).mockResolvedValue(undefined as never);
    vi.mocked(getCharacters).mockResolvedValue(mockCharacters as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(characterKeys.detail("char-1"), mockCharacter);

    const removeSpy = vi.spyOn(queryClient, "removeQueries");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate("char-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteCharacter).toHaveBeenCalledWith(mockClient, "char-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.detail("char-1") }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.lists() }),
    );
  });
});

// ---------------------------------------------------------------------------
// characterKeys factory
// ---------------------------------------------------------------------------

describe("characterKeys", () => {
  it("produces stable, unique keys per entity variant", () => {
    expect(characterKeys.all).toEqual(["characters"]);
    expect(characterKeys.lists()).toEqual(["characters", "list"]);
    expect(characterKeys.list({ page: 1 })).toEqual([
      "characters",
      "list",
      { page: 1 },
    ]);
    expect(characterKeys.detail("abc")).toEqual([
      "characters",
      "detail",
      "abc",
    ]);
    expect(characterKeys.timeline("abc")).toEqual([
      "characters",
      "timeline",
      "abc",
    ]);
    expect(characterKeys.network("abc", 2)).toEqual([
      "characters",
      "network",
      "abc",
      2,
    ]);
  });
});

describe("useAddMediaToCharacter", () => {
  it("calls addMediaToCharacter and invalidates character detail", async () => {
    vi.mocked(addMediaToCharacter).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddMediaToCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate({
      characterId: "char-1",
      mediaId: "media-1",
      isPrimary: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addMediaToCharacter).toHaveBeenCalledWith(
      mockClient,
      "char-1",
      "media-1",
      true,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.detail("char-1") }),
    );
  });
});

describe("useRemoveMediaFromCharacter", () => {
  it("calls removeMediaFromCharacter and invalidates character detail", async () => {
    vi.mocked(removeMediaFromCharacter).mockResolvedValue(undefined as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useRemoveMediaFromCharacter(mockClient),
      { wrapper },
    );

    result.current.mutate({ characterId: "char-1", mediaId: "media-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeMediaFromCharacter).toHaveBeenCalledWith(
      mockClient,
      "char-1",
      "media-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.detail("char-1") }),
    );
  });
});

describe("useSetPrimaryCharacterMedia", () => {
  it("calls setPrimaryCharacterMedia and invalidates character detail", async () => {
    vi.mocked(setPrimaryCharacterMedia).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useSetPrimaryCharacterMedia(mockClient),
      { wrapper },
    );

    result.current.mutate({ characterId: "char-1", mediaId: "media-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setPrimaryCharacterMedia).toHaveBeenCalledWith(
      mockClient,
      "char-1",
      "media-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.detail("char-1") }),
    );
  });

  it("optimistically flips is_primary across character_media before the server responds", async () => {
    vi.mocked(setPrimaryCharacterMedia).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      characterKeys.detail("char-1"),
      mockCharacterWithMedia,
    );

    const { result } = renderHook(
      () => useSetPrimaryCharacterMedia(mockClient),
      { wrapper },
    );

    result.current.mutate({ characterId: "char-1", mediaId: "media-2" });

    await waitFor(() => {
      const cached = queryClient.getQueryData<typeof mockCharacterWithMedia>(
        characterKeys.detail("char-1"),
      );
      expect(cached?.character_media).toEqual([
        { character_id: "char-1", media_id: "media-1", is_primary: false },
        { character_id: "char-1", media_id: "media-2", is_primary: true },
      ]);
    });
  });

  it("rolls back the optimistic primary swap on error", async () => {
    vi.mocked(setPrimaryCharacterMedia).mockRejectedValue(
      new Error("DB error"),
    );
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      characterKeys.detail("char-1"),
      mockCharacterWithMedia,
    );

    const { result } = renderHook(
      () => useSetPrimaryCharacterMedia(mockClient),
      { wrapper },
    );

    result.current.mutate({ characterId: "char-1", mediaId: "media-2" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(characterKeys.detail("char-1"))).toEqual(
      mockCharacterWithMedia,
    );
  });

  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(setPrimaryCharacterMedia).mockRejectedValue(
      new Error("DB error"),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSetPrimaryCharacterMedia(mockClient),
      { wrapper },
    );

    result.current.mutate({ characterId: "char-1", mediaId: "media-2" });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("characterMutationKeys", () => {
  it("produces distinct keys for update and autosave", () => {
    expect(characterMutationKeys.update).toEqual(["characters", "update"]);
    expect(characterMutationKeys.autosave).toEqual(["characters", "autosave"]);
  });
});

describe("useAutosaveCharacter", () => {
  it("calls updateCharacter and invalidates only the detail query", async () => {
    vi.mocked(updateCharacter).mockResolvedValue(mockCharacter as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAutosaveCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate({ id: "char-1", data: { biography: "Draft..." } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateCharacter).toHaveBeenCalledWith(mockClient, "char-1", {
      biography: "Draft...",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.detail("char-1") }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: characterKeys.lists() }),
    );
  });

  it("rolls back the optimistic snapshot on error", async () => {
    vi.mocked(updateCharacter).mockRejectedValue(new Error("DB error"));
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(characterKeys.detail("char-1"), mockCharacter);

    const { result } = renderHook(() => useAutosaveCharacter(mockClient), {
      wrapper,
    });

    result.current.mutate({ id: "char-1", data: { biography: "bad" } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(characterKeys.detail("char-1"))).toEqual(
      mockCharacter,
    );
  });
});

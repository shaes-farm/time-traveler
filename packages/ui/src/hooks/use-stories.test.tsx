import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useStories,
  useStoriesPage,
  useStoryFacetCounts,
  useStory,
  useStoryEvents,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  usePublishStory,
  useUnpublishStory,
  useAddCharacterToStory,
  useRemoveCharacterFromStory,
  useUpdateStoryCharacterRole,
  useAddEventToStory,
  useRemoveEventFromStory,
  useReorderStoryEvent,
  useAddPeriodToStory,
  useRemovePeriodFromStory,
  storyKeys,
} from "./use-stories";

vi.mock("@repo/services/story-service", () => ({
  getStories: vi.fn(),
  getStoriesPage: vi.fn(),
  getStoryFacetCounts: vi.fn(),
  getStoryById: vi.fn(),
  getStoryBySlug: vi.fn(),
  getStoryEvents: vi.fn(),
  createStory: vi.fn(),
  updateStory: vi.fn(),
  deleteStory: vi.fn(),
  publishStory: vi.fn(),
  unpublishStory: vi.fn(),
  addCharacterToStory: vi.fn(),
  removeCharacterFromStory: vi.fn(),
  updateStoryCharacterRole: vi.fn(),
  addEventToStory: vi.fn(),
  removeEventFromStory: vi.fn(),
  reorderStoryEvent: vi.fn(),
  addPeriodToStory: vi.fn(),
  removePeriodFromStory: vi.fn(),
}));

import {
  getStories,
  getStoriesPage,
  getStoryFacetCounts,
  getStoryById,
  getStoryEvents,
  createStory,
  updateStory,
  deleteStory,
  publishStory,
  unpublishStory,
  addCharacterToStory,
  removeCharacterFromStory,
  updateStoryCharacterRole,
  addEventToStory,
  removeEventFromStory,
  reorderStoryEvent,
  addPeriodToStory,
  removePeriodFromStory,
} from "@repo/services/story-service";

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

const mockStory = { id: "story-1", slug: "silmarillion", user_id: "user-1" };
const mockStories = [mockStory];

describe("useStories", () => {
  beforeEach(() => {
    vi.mocked(getStories).mockResolvedValue(mockStories as never);
  });

  it("calls getStories with client and filters", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStories(mockClient, {}), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStories).toHaveBeenCalledWith(mockClient, {});
  });
});

describe("useStoriesPage", () => {
  it("calls getStoriesPage with client and filters", async () => {
    vi.mocked(getStoriesPage).mockResolvedValue({
      rows: [],
      total: 0,
    } as never);
    const { wrapper } = createWrapper();
    const filters = { userId: "user-1", published: true };
    const { result } = renderHook(() => useStoriesPage(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStoriesPage).toHaveBeenCalledWith(mockClient, filters);
  });
});

describe("useStoryFacetCounts", () => {
  it("calls getStoryFacetCounts with client and filters", async () => {
    vi.mocked(getStoryFacetCounts).mockResolvedValue({
      narratorType: { first_person: 0, third_person: 0, omniscient: 0 },
      published: { published: 0, draft: 0 },
    } as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useStoryFacetCounts(mockClient, { userId: "user-1" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStoryFacetCounts).toHaveBeenCalledWith(mockClient, {
      userId: "user-1",
    });
  });
});

describe("useStory", () => {
  it("calls getStoryById with client and id", async () => {
    vi.mocked(getStoryById).mockResolvedValue(mockStory as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStory(mockClient, "story-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStoryById).toHaveBeenCalledWith(mockClient, "story-1");
  });
});

describe("useStoryEvents", () => {
  it("calls getStoryEvents with client and storyId", async () => {
    vi.mocked(getStoryEvents).mockResolvedValue([] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryEvents(mockClient, "story-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStoryEvents).toHaveBeenCalledWith(mockClient, "story-1");
  });
});

describe("useCreateStory", () => {
  it("calls createStory and invalidates list", async () => {
    vi.mocked(createStory).mockResolvedValue(mockStory as never);
    vi.mocked(getStories).mockResolvedValue(mockStories as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateStory(mockClient), {
      wrapper,
    });

    result.current.mutate({ title: "Silmarillion" } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createStory).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.lists() }),
    );
  });
});

describe("useUpdateStory", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updateStory).mockRejectedValue(new Error("fail"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(storyKeys.detail("story-1"), mockStory);

    const { result } = renderHook(() => useUpdateStory(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "story-1", data: { title: "Bad" } as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(storyKeys.detail("story-1"))).toEqual(
      mockStory,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateStory).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateStory(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "story-1", data: { title: "Bad" } as never });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteStory", () => {
  it("calls deleteStory and removes from cache", async () => {
    vi.mocked(deleteStory).mockResolvedValue(undefined as never);
    vi.mocked(getStories).mockResolvedValue(mockStories as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(storyKeys.detail("story-1"), mockStory);
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteStory(mockClient), {
      wrapper,
    });
    result.current.mutate("story-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteStory).toHaveBeenCalledWith(mockClient, "story-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("usePublishStory", () => {
  it("calls publishStory and invalidates the stories prefix", async () => {
    vi.mocked(publishStory).mockResolvedValue(mockStory as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => usePublishStory(mockClient), {
      wrapper,
    });

    result.current.mutate("story-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(publishStory).toHaveBeenCalledWith(mockClient, "story-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.all }),
    );
  });
});

describe("useUnpublishStory", () => {
  it("calls unpublishStory and invalidates the stories prefix", async () => {
    vi.mocked(unpublishStory).mockResolvedValue(mockStory as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUnpublishStory(mockClient), {
      wrapper,
    });

    result.current.mutate("story-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(unpublishStory).toHaveBeenCalledWith(mockClient, "story-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.all }),
    );
  });
});

describe("useAddCharacterToStory", () => {
  it("calls addCharacterToStory and invalidates story detail", async () => {
    vi.mocked(addCharacterToStory).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddCharacterToStory(mockClient), {
      wrapper,
    });

    result.current.mutate({ storyId: "story-1", characterId: "char-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addCharacterToStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "char-1",
      undefined,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("useRemoveCharacterFromStory", () => {
  it("calls removeCharacterFromStory and invalidates story detail", async () => {
    vi.mocked(removeCharacterFromStory).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useRemoveCharacterFromStory(mockClient),
      { wrapper },
    );

    result.current.mutate({ storyId: "story-1", characterId: "char-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeCharacterFromStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "char-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("useUpdateStoryCharacterRole", () => {
  it("calls updateStoryCharacterRole and invalidates story detail", async () => {
    vi.mocked(updateStoryCharacterRole).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useUpdateStoryCharacterRole(mockClient),
      { wrapper },
    );

    result.current.mutate({
      storyId: "story-1",
      characterId: "char-1",
      role: "protagonist",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateStoryCharacterRole).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "char-1",
      "protagonist",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("useAddEventToStory", () => {
  it("calls addEventToStory (default sortOrder) and invalidates detail + events", async () => {
    vi.mocked(addEventToStory).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddEventToStory(mockClient), {
      wrapper,
    });

    result.current.mutate({ storyId: "story-1", eventId: "evt-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addEventToStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "evt-1",
      undefined,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.events("story-1") }),
    );
  });

  it("threads an explicit sortOrder through to addEventToStory", async () => {
    vi.mocked(addEventToStory).mockResolvedValue({} as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddEventToStory(mockClient), {
      wrapper,
    });

    result.current.mutate({
      storyId: "story-1",
      eventId: "evt-1",
      sortOrder: 5,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addEventToStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "evt-1",
      5,
    );
  });
});

describe("useReorderStoryEvent", () => {
  it("calls reorderStoryEvent and invalidates detail + events", async () => {
    vi.mocked(reorderStoryEvent).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useReorderStoryEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({
      storyId: "story-1",
      eventId: "evt-1",
      sortOrder: 3,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reorderStoryEvent).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "evt-1",
      3,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.events("story-1") }),
    );
  });
});

describe("useRemoveEventFromStory", () => {
  it("calls removeEventFromStory and invalidates story detail", async () => {
    vi.mocked(removeEventFromStory).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRemoveEventFromStory(mockClient), {
      wrapper,
    });

    result.current.mutate({ storyId: "story-1", eventId: "evt-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeEventFromStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "evt-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("useAddPeriodToStory", () => {
  it("calls addPeriodToStory and invalidates story detail", async () => {
    vi.mocked(addPeriodToStory).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddPeriodToStory(mockClient), {
      wrapper,
    });

    result.current.mutate({ storyId: "story-1", periodId: "period-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addPeriodToStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "period-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("useRemovePeriodFromStory", () => {
  it("calls removePeriodFromStory and invalidates story detail", async () => {
    vi.mocked(removePeriodFromStory).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRemovePeriodFromStory(mockClient), {
      wrapper,
    });

    result.current.mutate({ storyId: "story-1", periodId: "period-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removePeriodFromStory).toHaveBeenCalledWith(
      mockClient,
      "story-1",
      "period-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: storyKeys.detail("story-1") }),
    );
  });
});

describe("storyKeys", () => {
  it("produces stable, unique keys", () => {
    expect(storyKeys.all).toEqual(["stories"]);
    expect(storyKeys.lists()).toEqual(["stories", "list"]);
    expect(storyKeys.page({ userId: "u" })).toEqual([
      "stories",
      "page",
      { userId: "u" },
    ]);
    expect(storyKeys.facetCounts({ userId: "u" })).toEqual([
      "stories",
      "facetCounts",
      { userId: "u" },
    ]);
    expect(storyKeys.detail("story-1")).toEqual([
      "stories",
      "detail",
      "story-1",
    ]);
    expect(storyKeys.bySlug("user-1", "silmarillion")).toEqual([
      "stories",
      "slug",
      "user-1",
      "silmarillion",
    ]);
    expect(storyKeys.events("story-1")).toEqual([
      "stories",
      "detail",
      "story-1",
      "events",
    ]);
  });
});

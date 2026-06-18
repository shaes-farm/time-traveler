import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useTimelines,
  useTimeline,
  useTimelinesPage,
  useCreateTimeline,
  useUpdateTimeline,
  useDeleteTimeline,
  usePublishTimeline,
  useUnpublishTimeline,
  useTimelineCollaborators,
  useAddCollaborator,
  useRemoveCollaborator,
  useUpdateCollaboratorRole,
  useEventTimelineLinks,
  useAddMediaToTimeline,
  useRemoveMediaFromTimeline,
  useReorderTimelineMedia,
  timelineKeys,
} from "./use-timelines";

vi.mock("@repo/services/timeline-service", () => ({
  getTimelines: vi.fn(),
  getTimelinesPage: vi.fn(),
  getTimelineById: vi.fn(),
  getTimelineBySlug: vi.fn(),
  createTimeline: vi.fn(),
  updateTimeline: vi.fn(),
  deleteTimeline: vi.fn(),
  publishTimeline: vi.fn(),
  unpublishTimeline: vi.fn(),
  getCollaborators: vi.fn(),
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn(),
  updateCollaboratorRole: vi.fn(),
  addEventToTimeline: vi.fn(),
  removeEventFromTimeline: vi.fn(),
  setTimelineEventSortOrder: vi.fn(),
  getEventTimelineLinks: vi.fn(),
  addMediaToTimeline: vi.fn(),
  removeMediaFromTimeline: vi.fn(),
  reorderTimelineMedia: vi.fn(),
}));

import {
  getTimelines,
  getTimelinesPage,
  getTimelineById,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  publishTimeline,
  unpublishTimeline,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  getEventTimelineLinks,
  addMediaToTimeline,
  removeMediaFromTimeline,
  reorderTimelineMedia,
} from "@repo/services/timeline-service";

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

const mockTimeline = { id: "tl-1", slug: "medieval", user_id: "user-1" };
const mockTimelines = [mockTimeline];

describe("useTimelines", () => {
  beforeEach(() => {
    vi.mocked(getTimelines).mockResolvedValue(mockTimelines as never);
  });

  it("calls getTimelines with client and filters", async () => {
    const filters = { visibility: "public" as const };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTimelines(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTimelines).toHaveBeenCalledWith(mockClient, filters);
    expect(result.current.data).toEqual(mockTimelines);
  });
});

describe("useTimeline", () => {
  beforeEach(() => {
    vi.mocked(getTimelineById).mockResolvedValue(mockTimeline as never);
  });

  it("calls getTimelineById with client and id", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTimeline(mockClient, "tl-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTimelineById).toHaveBeenCalledWith(mockClient, "tl-1");
  });
});

describe("useTimelineCollaborators", () => {
  it("calls getCollaborators with client and timelineId", async () => {
    const mockCollaborators = [{ user_id: "user-2", role: "editor" }];
    vi.mocked(getCollaborators).mockResolvedValue(mockCollaborators as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useTimelineCollaborators(mockClient, "tl-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCollaborators).toHaveBeenCalledWith(mockClient, "tl-1");
  });
});

describe("useEventTimelineLinks", () => {
  it("calls getEventTimelineLinks with client and eventId", async () => {
    vi.mocked(getEventTimelineLinks).mockResolvedValue([
      "tl-1",
      "tl-2",
    ] as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useEventTimelineLinks(mockClient, "event-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEventTimelineLinks).toHaveBeenCalledWith(mockClient, "event-1");
    expect(result.current.data).toEqual(["tl-1", "tl-2"]);
  });

  it("uses the eventLinks query key", () => {
    expect(timelineKeys.eventLinks("event-1")).toEqual([
      "timelines",
      "event-links",
      "event-1",
    ]);
  });
});

describe("useCreateTimeline", () => {
  it("calls createTimeline and invalidates list cache", async () => {
    vi.mocked(createTimeline).mockResolvedValue(mockTimeline as never);
    vi.mocked(getTimelines).mockResolvedValue(mockTimelines as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate({
      title: "Medieval Era",
      user_id: "user-1",
    } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createTimeline).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.lists() }),
    );
  });
});

describe("useUpdateTimeline", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updateTimeline).mockRejectedValue(new Error("fail"));
    vi.mocked(getTimelineById).mockResolvedValue(mockTimeline as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(timelineKeys.detail("tl-1"), mockTimeline);

    const { result } = renderHook(() => useUpdateTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate({ id: "tl-1", data: { title: "Bad" } as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(timelineKeys.detail("tl-1"))).toEqual(
      mockTimeline,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateTimeline).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTimeline(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "tl-1", data: { title: "Bad" } as never });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteTimeline", () => {
  it("calls deleteTimeline and removes from cache", async () => {
    vi.mocked(deleteTimeline).mockResolvedValue(undefined as never);
    vi.mocked(getTimelines).mockResolvedValue(mockTimelines as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(timelineKeys.detail("tl-1"), mockTimeline);

    const removeSpy = vi.spyOn(queryClient, "removeQueries");
    const { result } = renderHook(() => useDeleteTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate("tl-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.detail("tl-1") }),
    );
  });
});

describe("usePublishTimeline", () => {
  it("calls publishTimeline and invalidates timeline caches", async () => {
    const published = { ...mockTimeline, visibility: "public" };
    vi.mocked(publishTimeline).mockResolvedValue(published as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePublishTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate("tl-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.all }),
    );
  });
});

describe("useUnpublishTimeline", () => {
  it("calls unpublishTimeline and invalidates timeline caches", async () => {
    const unpublished = { ...mockTimeline, visibility: "private" };
    vi.mocked(unpublishTimeline).mockResolvedValue(unpublished as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUnpublishTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate("tl-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.all }),
    );
  });
});

describe("timelineKeys", () => {
  it("produces stable, unique keys", () => {
    expect(timelineKeys.all).toEqual(["timelines"]);
    expect(timelineKeys.lists()).toEqual(["timelines", "list"]);
    expect(timelineKeys.detail("tl-1")).toEqual([
      "timelines",
      "detail",
      "tl-1",
    ]);
    expect(timelineKeys.collaborators("tl-1")).toEqual([
      "timelines",
      "collaborators",
      "tl-1",
    ]);
  });
});

describe("useTimelinesPage", () => {
  const mockPage = { rows: [{ id: "tl-1", slug: "medieval" }], total: 1 };

  beforeEach(() => {
    vi.mocked(getTimelinesPage).mockResolvedValue(mockPage as never);
  });

  it("returns rows and total from getTimelinesPage", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTimelinesPage(mockClient, {}), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTimelinesPage).toHaveBeenCalledWith(mockClient, {});
    expect(result.current.data).toEqual(mockPage);
  });

  it("passes filters to getTimelinesPage", async () => {
    const filters = { timelineType: "biographical" as const, published: true };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTimelinesPage(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTimelinesPage).toHaveBeenCalledWith(mockClient, filters);
  });

  it("uses timelineKeys.page(filters) as the query key (distinct from list)", async () => {
    const filters = { sortBy: "title" as const };
    const { wrapper, queryClient } = createWrapper();
    renderHook(() => useTimelinesPage(mockClient, filters), { wrapper });

    await waitFor(() =>
      expect(
        queryClient.getQueryData(timelineKeys.page(filters)),
      ).toBeDefined(),
    );
    // Must NOT collide with the rows-only list key
    expect(
      queryClient.getQueryData(timelineKeys.list(filters)),
    ).toBeUndefined();
  });
});

const collabRows = [
  { timeline_id: "tl-1", user_id: "user-2", role: "viewer" },
  { timeline_id: "tl-1", user_id: "user-3", role: "editor" },
];

describe("useAddCollaborator", () => {
  it("calls addCollaborator and invalidates the collaborator list", async () => {
    vi.mocked(addCollaborator).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddCollaborator(mockClient), {
      wrapper,
    });

    result.current.mutate({
      timelineId: "tl-1",
      userId: "user-2",
      role: "viewer",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addCollaborator).toHaveBeenCalledWith(
      mockClient,
      "tl-1",
      "user-2",
      "viewer",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: timelineKeys.collaborators("tl-1"),
      }),
    );
  });
});

describe("useUpdateCollaboratorRole", () => {
  it("optimistically rewrites the role in the cached list", async () => {
    vi.mocked(updateCollaboratorRole).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(timelineKeys.collaborators("tl-1"), collabRows);

    const { result } = renderHook(() => useUpdateCollaboratorRole(mockClient), {
      wrapper,
    });
    result.current.mutate({
      timelineId: "tl-1",
      userId: "user-2",
      role: "admin",
    });

    await waitFor(() => {
      const rows = queryClient.getQueryData<typeof collabRows>(
        timelineKeys.collaborators("tl-1"),
      );
      expect(rows?.find((r) => r.user_id === "user-2")?.role).toBe("admin");
    });
  });

  it("rolls back the optimistic role change on error", async () => {
    vi.mocked(updateCollaboratorRole).mockRejectedValue(new Error("fail"));
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(timelineKeys.collaborators("tl-1"), collabRows);

    const { result } = renderHook(() => useUpdateCollaboratorRole(mockClient), {
      wrapper,
    });
    result.current.mutate({
      timelineId: "tl-1",
      userId: "user-2",
      role: "admin",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const rows = queryClient.getQueryData<typeof collabRows>(
      timelineKeys.collaborators("tl-1"),
    );
    expect(rows?.find((r) => r.user_id === "user-2")?.role).toBe("viewer");
  });
});

describe("useRemoveCollaborator", () => {
  it("optimistically drops the row, then invalidates", async () => {
    vi.mocked(removeCollaborator).mockResolvedValue(undefined as never);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(timelineKeys.collaborators("tl-1"), collabRows);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemoveCollaborator(mockClient), {
      wrapper,
    });
    result.current.mutate({ timelineId: "tl-1", userId: "user-2" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeCollaborator).toHaveBeenCalledWith(
      mockClient,
      "tl-1",
      "user-2",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: timelineKeys.collaborators("tl-1"),
      }),
    );
  });

  it("rolls back the optimistic removal on error", async () => {
    vi.mocked(removeCollaborator).mockRejectedValue(new Error("fail"));
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(timelineKeys.collaborators("tl-1"), collabRows);

    const { result } = renderHook(() => useRemoveCollaborator(mockClient), {
      wrapper,
    });
    result.current.mutate({ timelineId: "tl-1", userId: "user-2" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const rows = queryClient.getQueryData<typeof collabRows>(
      timelineKeys.collaborators("tl-1"),
    );
    expect(rows?.some((r) => r.user_id === "user-2")).toBe(true);
  });
});

describe("useAddMediaToTimeline", () => {
  it("calls addMediaToTimeline and invalidates timeline detail", async () => {
    vi.mocked(addMediaToTimeline).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddMediaToTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate({
      timelineId: "tl-1",
      mediaId: "media-1",
      sortOrder: 2,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addMediaToTimeline).toHaveBeenCalledWith(
      mockClient,
      "tl-1",
      "media-1",
      2,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.detail("tl-1") }),
    );
  });
});

describe("useRemoveMediaFromTimeline", () => {
  it("calls removeMediaFromTimeline and invalidates timeline detail", async () => {
    vi.mocked(removeMediaFromTimeline).mockResolvedValue(undefined as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useRemoveMediaFromTimeline(mockClient),
      {
        wrapper,
      },
    );

    result.current.mutate({ timelineId: "tl-1", mediaId: "media-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeMediaFromTimeline).toHaveBeenCalledWith(
      mockClient,
      "tl-1",
      "media-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.detail("tl-1") }),
    );
  });
});

describe("useReorderTimelineMedia", () => {
  it("calls reorderTimelineMedia and invalidates timeline detail", async () => {
    vi.mocked(reorderTimelineMedia).mockResolvedValue({} as never);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useReorderTimelineMedia(mockClient), {
      wrapper,
    });

    result.current.mutate({
      timelineId: "tl-1",
      mediaId: "media-1",
      sortOrder: 3,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reorderTimelineMedia).toHaveBeenCalledWith(
      mockClient,
      "tl-1",
      "media-1",
      3,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: timelineKeys.detail("tl-1") }),
    );
  });
});

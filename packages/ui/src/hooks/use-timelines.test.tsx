import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useTimelines,
  useTimeline,
  useCreateTimeline,
  useUpdateTimeline,
  useDeleteTimeline,
  usePublishTimeline,
  useUnpublishTimeline,
  useTimelineCollaborators,
  timelineKeys,
} from "./use-timelines.js";

vi.mock("@repo/services/timeline-service.js", () => ({
  getTimelines: vi.fn(),
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
  addMediaToTimeline: vi.fn(),
}));

import {
  getTimelines,
  getTimelineById,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  publishTimeline,
  unpublishTimeline,
  getCollaborators,
} from "@repo/services/timeline-service.js";

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

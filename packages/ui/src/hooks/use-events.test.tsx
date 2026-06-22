import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useEvents,
  useEventsPage,
  useEvent,
  useEventParticipants,
  useEventsInTemporalRange,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  usePublishEvent,
  useUnpublishEvent,
  useAddCharacterToEvent,
  useRemoveCharacterFromEvent,
  useAddCategoryToEvent,
  useRemoveCategoryFromEvent,
  useAddMediaToEvent,
  useRemoveMediaFromEvent,
  useReorderEventMedia,
  eventKeys,
} from "./use-events";

vi.mock("@repo/services/event-service", () => ({
  getEvents: vi.fn(),
  getEventsPage: vi.fn(),
  getEventById: vi.fn(),
  getEventBySlug: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  publishEvent: vi.fn(),
  unpublishEvent: vi.fn(),
  getEventParticipants: vi.fn(),
  getEventsInTemporalRange: vi.fn(),
  addCharacterToEvent: vi.fn(),
  removeCharacterFromEvent: vi.fn(),
  addCategoryToEvent: vi.fn(),
  removeCategoryFromEvent: vi.fn(),
  addMediaToEvent: vi.fn(),
  removeMediaFromEvent: vi.fn(),
  reorderEventMedia: vi.fn(),
  setParentEvent: vi.fn(),
  getChildEvents: vi.fn(),
}));

import {
  getEvents,
  getEventsPage,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  getEventParticipants,
  getEventsInTemporalRange,
  addCharacterToEvent,
  removeCharacterFromEvent,
  addCategoryToEvent,
  removeCategoryFromEvent,
  addMediaToEvent,
  removeMediaFromEvent,
  reorderEventMedia,
} from "@repo/services/event-service";

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

const mockEvent = { id: "evt-1", slug: "battle-of-helm", user_id: "user-1" };
const mockEvents = [mockEvent];

describe("useEvents", () => {
  beforeEach(() => {
    vi.mocked(getEvents).mockResolvedValue(mockEvents as never);
  });

  it("calls getEvents with client and filters", async () => {
    const filters = { eventType: "battle" as never };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEvents(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEvents).toHaveBeenCalledWith(mockClient, filters);
  });
});

describe("useEventsPage", () => {
  it("calls getEventsPage with client and filters and returns the page", async () => {
    const page = { rows: mockEvents, total: 1 };
    vi.mocked(getEventsPage).mockResolvedValue(page as never);
    const filters = { eventType: "milestone" as never, page: 2 };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEventsPage(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEventsPage).toHaveBeenCalledWith(mockClient, filters);
    expect(result.current.data).toEqual(page);
  });

  it("uses a distinct query key from useEvents", () => {
    const filters = { eventType: "milestone" as never };
    expect(eventKeys.page(filters)).not.toEqual(eventKeys.list(filters));
  });
});

describe("useEvent", () => {
  beforeEach(() => {
    vi.mocked(getEventById).mockResolvedValue(mockEvent as never);
  });

  it("calls getEventById with client and id", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEvent(mockClient, "evt-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEventById).toHaveBeenCalledWith(mockClient, "evt-1");
  });
});

describe("useEventParticipants", () => {
  it("calls getEventParticipants with client and eventId", async () => {
    vi.mocked(getEventParticipants).mockResolvedValue([] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useEventParticipants(mockClient, "evt-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEventParticipants).toHaveBeenCalledWith(mockClient, "evt-1");
  });
});

describe("useEventsInTemporalRange", () => {
  it("calls getEventsInTemporalRange with client, start, end", async () => {
    vi.mocked(getEventsInTemporalRange).mockResolvedValue(mockEvents as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useEventsInTemporalRange(mockClient, -1000, 1000),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEventsInTemporalRange).toHaveBeenCalledWith(
      mockClient,
      -1000,
      1000,
    );
  });
});

describe("useCreateEvent", () => {
  it("calls createEvent and invalidates list", async () => {
    vi.mocked(createEvent).mockResolvedValue(mockEvent as never);
    vi.mocked(getEvents).mockResolvedValue(mockEvents as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({ title: "Battle", user_id: "user-1" } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createEvent).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.lists() }),
    );
  });
});

describe("useUpdateEvent", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updateEvent).mockRejectedValue(new Error("fail"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(eventKeys.detail("evt-1"), mockEvent);

    const { result } = renderHook(() => useUpdateEvent(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "evt-1", data: { title: "Bad" } as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(eventKeys.detail("evt-1"))).toEqual(
      mockEvent,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateEvent).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateEvent(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "evt-1", data: { title: "Bad" } as never });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteEvent", () => {
  it("calls deleteEvent and removes from cache", async () => {
    vi.mocked(deleteEvent).mockResolvedValue(undefined as never);
    vi.mocked(getEvents).mockResolvedValue(mockEvents as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(eventKeys.detail("evt-1"), mockEvent);

    const removeSpy = vi.spyOn(queryClient, "removeQueries");
    const { result } = renderHook(() => useDeleteEvent(mockClient), {
      wrapper,
    });

    result.current.mutate("evt-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteEvent).toHaveBeenCalledWith(mockClient, "evt-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.detail("evt-1") }),
    );
  });
});

describe("usePublishEvent", () => {
  it("calls publishEvent and invalidates all event caches", async () => {
    vi.mocked(publishEvent).mockResolvedValue(mockEvent as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => usePublishEvent(mockClient), {
      wrapper,
    });

    result.current.mutate("evt-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(publishEvent).toHaveBeenCalledWith(mockClient, "evt-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.all }),
    );
  });
});

describe("useUnpublishEvent", () => {
  it("calls unpublishEvent and invalidates all event caches", async () => {
    vi.mocked(unpublishEvent).mockResolvedValue(mockEvent as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUnpublishEvent(mockClient), {
      wrapper,
    });

    result.current.mutate("evt-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(unpublishEvent).toHaveBeenCalledWith(mockClient, "evt-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.all }),
    );
  });
});

describe("useAddCharacterToEvent", () => {
  it("calls addCharacterToEvent and invalidates participants + detail", async () => {
    vi.mocked(addCharacterToEvent).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddCharacterToEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({
      eventId: "evt-1",
      characterId: "char-1",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addCharacterToEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "char-1",
      undefined,
      undefined,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.participants("evt-1") }),
    );
  });
});

describe("useRemoveCharacterFromEvent", () => {
  it("calls removeCharacterFromEvent and invalidates caches", async () => {
    vi.mocked(removeCharacterFromEvent).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useRemoveCharacterFromEvent(mockClient),
      { wrapper },
    );

    result.current.mutate({ eventId: "evt-1", characterId: "char-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeCharacterFromEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "char-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.participants("evt-1") }),
    );
  });
});

describe("useAddCategoryToEvent", () => {
  it("calls addCategoryToEvent and invalidates event detail", async () => {
    vi.mocked(addCategoryToEvent).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddCategoryToEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({ eventId: "evt-1", categoryId: "cat-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addCategoryToEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "cat-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.detail("evt-1") }),
    );
  });
});

describe("useRemoveCategoryFromEvent", () => {
  it("calls removeCategoryFromEvent and invalidates event detail", async () => {
    vi.mocked(removeCategoryFromEvent).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useRemoveCategoryFromEvent(mockClient),
      { wrapper },
    );

    result.current.mutate({ eventId: "evt-1", categoryId: "cat-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeCategoryFromEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "cat-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.detail("evt-1") }),
    );
  });
});

describe("useAddMediaToEvent", () => {
  it("calls addMediaToEvent and invalidates event detail", async () => {
    vi.mocked(addMediaToEvent).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddMediaToEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({ eventId: "evt-1", mediaId: "media-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addMediaToEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "media-1",
      undefined,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.detail("evt-1") }),
    );
  });

  it("forwards an explicit sortOrder", async () => {
    vi.mocked(addMediaToEvent).mockResolvedValue({} as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddMediaToEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({
      eventId: "evt-1",
      mediaId: "media-1",
      sortOrder: 3,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addMediaToEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "media-1",
      3,
    );
  });
});

describe("useRemoveMediaFromEvent", () => {
  it("calls removeMediaFromEvent and invalidates event detail", async () => {
    vi.mocked(removeMediaFromEvent).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRemoveMediaFromEvent(mockClient), {
      wrapper,
    });

    result.current.mutate({ eventId: "evt-1", mediaId: "media-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeMediaFromEvent).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "media-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.detail("evt-1") }),
    );
  });
});

describe("useReorderEventMedia", () => {
  it("calls reorderEventMedia and invalidates event detail", async () => {
    vi.mocked(reorderEventMedia).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useReorderEventMedia(mockClient), {
      wrapper,
    });

    result.current.mutate({
      eventId: "evt-1",
      mediaId: "media-1",
      sortOrder: 2,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reorderEventMedia).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
      "media-1",
      2,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: eventKeys.detail("evt-1") }),
    );
  });
});

describe("eventKeys", () => {
  it("produces stable, unique keys", () => {
    expect(eventKeys.all).toEqual(["events"]);
    expect(eventKeys.participants("evt-1")).toEqual([
      "events",
      "participants",
      "evt-1",
    ]);
    expect(eventKeys.temporalRange(-1000, 1000)).toEqual([
      "events",
      "temporalRange",
      -1000,
      1000,
    ]);
  });
});

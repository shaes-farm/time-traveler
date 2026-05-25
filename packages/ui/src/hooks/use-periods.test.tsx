import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  usePeriods,
  usePeriod,
  useCreatePeriod,
  useUpdatePeriod,
  useDeletePeriod,
  useChildPeriods,
  useAddPeriodToTimeline,
  useRemovePeriodFromTimeline,
  periodKeys,
} from "./use-periods.js";

vi.mock("@repo/services/period-service.js", () => ({
  getPeriods: vi.fn(),
  getPeriodById: vi.fn(),
  getPeriodBySlug: vi.fn(),
  createPeriod: vi.fn(),
  updatePeriod: vi.fn(),
  deletePeriod: vi.fn(),
  getChildPeriods: vi.fn(),
  addPeriodToTimeline: vi.fn(),
  removePeriodFromTimeline: vi.fn(),
}));

import {
  getPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getChildPeriods,
  addPeriodToTimeline,
  removePeriodFromTimeline,
} from "@repo/services/period-service.js";

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

const mockPeriod = { id: "period-1", slug: "dark-ages", user_id: "user-1" };
const mockPeriods = [mockPeriod];

describe("usePeriods", () => {
  beforeEach(() => {
    vi.mocked(getPeriods).mockResolvedValue(mockPeriods as never);
  });

  it("calls getPeriods with client and filters", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePeriods(mockClient, {}), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPeriods).toHaveBeenCalledWith(mockClient, {});
  });
});

describe("usePeriod", () => {
  it("calls getPeriodById with client and id", async () => {
    vi.mocked(getPeriodById).mockResolvedValue(mockPeriod as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePeriod(mockClient, "period-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPeriodById).toHaveBeenCalledWith(mockClient, "period-1");
  });
});

describe("useChildPeriods", () => {
  it("calls getChildPeriods with client and parentId", async () => {
    vi.mocked(getChildPeriods).mockResolvedValue([] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useChildPeriods(mockClient, "period-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getChildPeriods).toHaveBeenCalledWith(mockClient, "period-1");
  });
});

describe("useCreatePeriod", () => {
  it("calls createPeriod and invalidates list", async () => {
    vi.mocked(createPeriod).mockResolvedValue(mockPeriod as never);
    vi.mocked(getPeriods).mockResolvedValue(mockPeriods as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreatePeriod(mockClient), {
      wrapper,
    });

    result.current.mutate({ title: "Dark Ages", user_id: "user-1" } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createPeriod).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: periodKeys.lists() }),
    );
  });
});

describe("useUpdatePeriod", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updatePeriod).mockRejectedValue(new Error("fail"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(periodKeys.detail("period-1"), mockPeriod);

    const { result } = renderHook(() => useUpdatePeriod(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "period-1", data: { title: "Bad" } as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(periodKeys.detail("period-1"))).toEqual(
      mockPeriod,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updatePeriod).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePeriod(mockClient), {
      wrapper,
    });
    result.current.mutate({ id: "period-1", data: { title: "Bad" } as never });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeletePeriod", () => {
  it("calls deletePeriod and removes from cache", async () => {
    vi.mocked(deletePeriod).mockResolvedValue(undefined as never);
    vi.mocked(getPeriods).mockResolvedValue(mockPeriods as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(periodKeys.detail("period-1"), mockPeriod);
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeletePeriod(mockClient), {
      wrapper,
    });
    result.current.mutate("period-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deletePeriod).toHaveBeenCalledWith(mockClient, "period-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: periodKeys.detail("period-1") }),
    );
  });
});

describe("useAddPeriodToTimeline", () => {
  it("calls addPeriodToTimeline and invalidates period detail", async () => {
    vi.mocked(addPeriodToTimeline).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddPeriodToTimeline(mockClient), {
      wrapper,
    });

    result.current.mutate({ periodId: "period-1", timelineId: "tl-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addPeriodToTimeline).toHaveBeenCalledWith(
      mockClient,
      "period-1",
      "tl-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: periodKeys.detail("period-1") }),
    );
  });
});

describe("useRemovePeriodFromTimeline", () => {
  it("calls removePeriodFromTimeline and invalidates period detail", async () => {
    vi.mocked(removePeriodFromTimeline).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useRemovePeriodFromTimeline(mockClient),
      { wrapper },
    );

    result.current.mutate({ periodId: "period-1", timelineId: "tl-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removePeriodFromTimeline).toHaveBeenCalledWith(
      mockClient,
      "period-1",
      "tl-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: periodKeys.detail("period-1") }),
    );
  });
});

describe("periodKeys", () => {
  it("produces stable, unique keys", () => {
    expect(periodKeys.all).toEqual(["periods"]);
    expect(periodKeys.lists()).toEqual(["periods", "list"]);
    expect(periodKeys.children("period-1")).toEqual([
      "periods",
      "children",
      "period-1",
    ]);
  });
});

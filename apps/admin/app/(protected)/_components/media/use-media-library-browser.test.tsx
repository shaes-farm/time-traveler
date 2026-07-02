import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaLibraryBrowser } from "./use-media-library-browser";

const h = vi.hoisted(() => ({
  libraryCalls: [] as Record<string, unknown>[],
  facetCalls: [] as Record<string, unknown>[],
  rows: [{ id: "m1" }, { id: "m2" }] as unknown[],
  nextCursor: "CURSOR_2" as string | null,
  hasMore: true,
  refetch: vi.fn(),
}));

vi.mock("@repo/ui/hooks/use-media", () => ({
  useMediaLibrary: (_client: unknown, filters: Record<string, unknown>) => {
    h.libraryCalls.push(filters);
    return {
      data: { rows: h.rows, nextCursor: h.nextCursor, hasMore: h.hasMore },
      isPending: false,
      isError: false,
      refetch: h.refetch,
    };
  },
  useMediaFacetCounts: (_client: unknown, filters: Record<string, unknown>) => {
    h.facetCalls.push(filters);
    return { data: undefined };
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = {} as any;

const lastLibraryCall = () => h.libraryCalls[h.libraryCalls.length - 1]!;

beforeEach(() => {
  h.libraryCalls = [];
  h.facetCalls = [];
  h.nextCursor = "CURSOR_2";
  h.hasMore = true;
  h.refetch.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useMediaLibraryBrowser", () => {
  it("debounces the search box before it drives the query", () => {
    const { result } = renderHook(() => useMediaLibraryBrowser(client));
    expect(lastLibraryCall().search).toBeUndefined();

    act(() => result.current.setSearch("cats"));
    // Not yet — still within the debounce window.
    expect(lastLibraryCall().search).toBeUndefined();

    act(() => vi.advanceTimersByTime(250));
    expect(lastLibraryCall().search).toBe("cats");
  });

  it("advances and rewinds the keyset cursor via the pager", () => {
    const { result } = renderHook(() => useMediaLibraryBrowser(client));
    expect(lastLibraryCall().cursor).toBeUndefined();
    expect(result.current.pager.hasPrev).toBe(false);
    expect(result.current.pager.hasNext).toBe(true);

    act(() => result.current.pager.onNext());
    expect(lastLibraryCall().cursor).toBe("CURSOR_2");
    expect(result.current.pager.hasPrev).toBe(true);

    act(() => result.current.pager.onPrev());
    expect(lastLibraryCall().cursor).toBeUndefined();
    expect(result.current.pager.hasPrev).toBe(false);
  });

  it("resets the cursor and fires onFiltersReset when facets change", () => {
    const onFiltersReset = vi.fn();
    const { result } = renderHook(() =>
      useMediaLibraryBrowser(client, { onFiltersReset }),
    );

    act(() => result.current.pager.onNext());
    expect(result.current.pager.hasPrev).toBe(true);

    act(() =>
      result.current.setFacets({
        mediaTypes: ["image"],
        sources: [],
        attachedTo: [],
      }),
    );

    expect(result.current.pager.hasPrev).toBe(false);
    expect(lastLibraryCall().cursor).toBeUndefined();
    expect(lastLibraryCall().mediaTypes).toEqual(["image"]);
    expect(onFiltersReset).toHaveBeenCalled();
  });

  it("clearFilters empties search and facets", () => {
    const { result } = renderHook(() =>
      useMediaLibraryBrowser(client, {
        initialFacets: {
          mediaTypes: ["video"],
          sources: ["external"],
          attachedTo: [],
        },
      }),
    );
    expect(lastLibraryCall().mediaTypes).toEqual(["video"]);

    act(() => result.current.clearFilters());
    act(() => vi.advanceTimersByTime(250));

    expect(result.current.search).toBe("");
    expect(result.current.facets.mediaTypes).toEqual([]);
    expect(lastLibraryCall().mediaTypes).toEqual([]);
  });
});

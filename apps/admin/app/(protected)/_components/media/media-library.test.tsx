import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MediaPickerProps } from "@repo/ui/components/media-picker";
import type { MediaDetailDrawerProps } from "@repo/ui/components/media-detail-drawer";
import { MediaLibrary } from "./media-library";

// Capture the props each primitive receives so we can drive the page's
// callbacks directly and assert what it passes down.
const h = vi.hoisted(() => ({
  pickerProps: null as MediaPickerProps | null,
  drawerProps: null as MediaDetailDrawerProps | null,
  dialogProps: null as Record<string, unknown> | null,
  libraryCalls: [] as unknown[],
  facetCalls: [] as unknown[],
  bulkMutate: vi.fn(),
  rows: [
    { id: "m1", slug: "one", attachmentCounts: { total: 0 } },
    { id: "m2", slug: "two", attachmentCounts: { total: 0 } },
  ] as unknown[],
  nextCursor: "CURSOR_2" as string | null,
  hasMore: true,
}));

vi.mock("../../../../lib/auth/browser-client", () => ({
  getBrowserSupabaseClient: () => ({}) as unknown,
}));

vi.mock("@repo/ui/hooks/use-media", () => ({
  mediaKeys: { all: ["media"] },
  useMediaLibrary: (_client: unknown, filters: unknown) => {
    h.libraryCalls.push(filters);
    return {
      data: { rows: h.rows, nextCursor: h.nextCursor, hasMore: h.hasMore },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
  useMediaFacetCounts: (_client: unknown, filters: unknown) => {
    h.facetCalls.push(filters);
    return { data: undefined };
  },
  useDeleteMediaBulk: () => ({ mutate: h.bulkMutate }),
}));

vi.mock("@repo/ui/components/media-picker", () => ({
  MediaPicker: (props: MediaPickerProps) => {
    h.pickerProps = props;
    return <div data-testid="picker" />;
  },
  MediaDetailDrawer: (props: MediaDetailDrawerProps) => {
    h.drawerProps = props;
    return <div data-testid="drawer" />;
  },
}));

vi.mock("./attach-media-dialog", () => ({
  AttachMediaDialog: (props: Record<string, unknown>) => {
    h.dialogProps = props;
    return <div data-testid="dialog" />;
  },
}));

function renderLibrary(initialFacets?: {
  mediaTypes: string[];
  sources: string[];
  attachedTo: string[];
}) {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  render(
    <QueryClientProvider client={queryClient}>
      <MediaLibrary initialFacets={initialFacets} />
    </QueryClientProvider>,
  );
  return { invalidateSpy };
}

/** Latest filters object handed to useMediaLibrary. */
function lastLibraryFilters() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return h.libraryCalls.at(-1) as any;
}

beforeEach(() => {
  h.pickerProps = null;
  h.drawerProps = null;
  h.dialogProps = null;
  h.libraryCalls = [];
  h.facetCalls = [];
  h.bulkMutate.mockReset();
  h.nextCursor = "CURSOR_2";
  h.hasMore = true;
});

describe("MediaLibrary", () => {
  it("renders the browse picker with the library rows", () => {
    renderLibrary();
    expect(h.pickerProps?.mode).toBe("browse");
    expect(h.pickerProps?.items).toHaveLength(2);
    expect(h.pickerProps?.pager.hasNext).toBe(true);
    expect(h.pickerProps?.pager.hasPrev).toBe(false);
  });

  it("opens the detail drawer with the selected row, in place", () => {
    renderLibrary();
    act(() => h.pickerProps!.onOpen!("m2"));
    expect(h.drawerProps?.open).toBe(true);
    expect(h.drawerProps?.media?.id).toBe("m2");
  });

  it("upload entry opens the library-variant dialog and creates an orphan (invalidate only, no junction)", async () => {
    const { invalidateSpy } = renderLibrary();
    act(() => h.pickerProps!.onUpload!());
    expect(h.dialogProps?.open).toBe(true);
    expect(h.dialogProps?.variant).toBe("library");
    expect(h.dialogProps?.defaultTab).toBe("upload");

    // The onAttached the page passes only refreshes caches — it writes no junction.
    await act(async () => {
      await (h.dialogProps!.onAttached as (id: string) => Promise<void>)("m9");
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["media"] });
  });

  it("external entry opens the dialog on the external tab", () => {
    renderLibrary();
    act(() => h.pickerProps!.onAddExternal!());
    expect(h.dialogProps?.defaultTab).toBe("external");
  });

  it("pager Next advances the cursor and Prev pops it", () => {
    renderLibrary();
    expect(lastLibraryFilters().cursor).toBeUndefined();
    act(() => h.pickerProps!.pager.onNext());
    expect(lastLibraryFilters().cursor).toBe("CURSOR_2");
    expect(h.pickerProps?.pager.hasPrev).toBe(true);
    act(() => h.pickerProps!.pager.onPrev());
    expect(lastLibraryFilters().cursor).toBeUndefined();
  });

  it("resets pagination when the facets change", () => {
    renderLibrary();
    act(() => h.pickerProps!.pager.onNext());
    expect(lastLibraryFilters().cursor).toBe("CURSOR_2");
    act(() =>
      h.pickerProps!.onFacetsChange({
        mediaTypes: ["image"],
        sources: [],
        attachedTo: [],
      }),
    );
    expect(lastLibraryFilters().cursor).toBeUndefined();
  });

  it("offers bulk delete only when filtered to exactly Orphaned", () => {
    renderLibrary({ mediaTypes: [], sources: [], attachedTo: ["orphaned"] });
    expect(h.pickerProps?.bulkSelectable).toBe(true);

    act(() => h.pickerProps!.onBulkSelectedChange!(new Set(["m1", "m2"])));
    act(() => h.pickerProps!.onDeleteSelected!());
    expect(h.bulkMutate).toHaveBeenCalledWith(["m1", "m2"], expect.any(Object));
  });

  it("does not offer bulk delete for other facets", () => {
    renderLibrary({ mediaTypes: [], sources: [], attachedTo: ["events"] });
    expect(h.pickerProps?.bulkSelectable).toBe(false);
  });

  it("clears search and facets on Clear filters", () => {
    renderLibrary({ mediaTypes: ["image"], sources: [], attachedTo: [] });
    expect(h.pickerProps?.facets.mediaTypes).toEqual(["image"]);
    act(() => h.pickerProps!.onClearFilters());
    expect(h.pickerProps?.facets.mediaTypes).toEqual([]);
  });
});

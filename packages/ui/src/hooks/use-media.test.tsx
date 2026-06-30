import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useMedia,
  useMediaItem,
  useMediaSignedUrl,
  useUploadMedia,
  useCreateExternalMedia,
  useUpdateMedia,
  useDeleteMedia,
  useDeleteMediaBulk,
  useMediaLibrary,
  useMediaFacetCounts,
  useMediaAttachments,
  useMediaAttachmentsBulk,
  mediaKeys,
} from "./use-media";

vi.mock("@repo/services/media-service", () => ({
  getMedia: vi.fn(),
  getMediaById: vi.fn(),
  uploadMedia: vi.fn(),
  createExternalMedia: vi.fn(),
  updateMedia: vi.fn(),
  deleteMedia: vi.fn(),
  getSignedUrl: vi.fn(),
  getMediaLibraryPage: vi.fn(),
  getMediaFacetCounts: vi.fn(),
  getMediaAttachments: vi.fn(),
  getMediaAttachmentsBulk: vi.fn(),
}));

import {
  getMedia,
  getMediaById,
  uploadMedia,
  createExternalMedia,
  updateMedia,
  deleteMedia,
  getSignedUrl,
  getMediaLibraryPage,
  getMediaFacetCounts,
  getMediaAttachments,
  getMediaAttachmentsBulk,
} from "@repo/services/media-service";

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

const mockMediaRow = {
  id: "media-1",
  slug: "helm-deep-banner",
  user_id: "user-1",
  url: "https://example.com/image.jpg",
};
const mockMediaList = [mockMediaRow];

describe("useMedia", () => {
  beforeEach(() => {
    vi.mocked(getMedia).mockResolvedValue(mockMediaList as never);
  });

  it("calls getMedia with client and filters", async () => {
    const filters = { mediaType: "image" as never };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMedia(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMedia).toHaveBeenCalledWith(mockClient, filters);
    expect(result.current.data).toEqual(mockMediaList);
  });
});

describe("useMediaItem", () => {
  it("calls getMediaById with client and id", async () => {
    vi.mocked(getMediaById).mockResolvedValue(mockMediaRow as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMediaItem(mockClient, "media-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMediaById).toHaveBeenCalledWith(mockClient, "media-1");
    expect(result.current.data).toEqual(mockMediaRow);
  });
});

describe("useMediaSignedUrl", () => {
  it("calls getSignedUrl with client, id, and expiresInSeconds", async () => {
    vi.mocked(getSignedUrl).mockResolvedValue("https://signed.url" as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useMediaSignedUrl(mockClient, "media-1", 600),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSignedUrl).toHaveBeenCalledWith(mockClient, "media-1", 600);
    expect(result.current.data).toBe("https://signed.url");
  });

  it("defaults expiresInSeconds to 3600", async () => {
    vi.mocked(getSignedUrl).mockResolvedValue("https://signed.url" as never);
    const { wrapper } = createWrapper();
    renderHook(() => useMediaSignedUrl(mockClient, "media-1"), { wrapper });

    await waitFor(() => expect(getSignedUrl).toHaveBeenCalled());
    expect(getSignedUrl).toHaveBeenCalledWith(mockClient, "media-1", 3600);
  });
});

describe("useUploadMedia", () => {
  it("calls uploadMedia and invalidates list cache", async () => {
    vi.mocked(uploadMedia).mockResolvedValue(mockMediaRow as never);
    vi.mocked(getMedia).mockResolvedValue(mockMediaList as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUploadMedia(mockClient), {
      wrapper,
    });

    result.current.mutate({
      file: new Blob(["data"]),
      fileName: "image.jpg",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(uploadMedia).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: mediaKeys.lists() }),
    );
  });
});

describe("useCreateExternalMedia", () => {
  it("calls createExternalMedia and invalidates list cache", async () => {
    vi.mocked(createExternalMedia).mockResolvedValue(mockMediaRow as never);
    vi.mocked(getMedia).mockResolvedValue(mockMediaList as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateExternalMedia(mockClient), {
      wrapper,
    });

    result.current.mutate({ url: "https://external.com/img.jpg" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createExternalMedia).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: mediaKeys.lists() }),
    );
  });
});

describe("useUpdateMedia", () => {
  it("rolls back optimistic update on error", async () => {
    vi.mocked(updateMedia).mockRejectedValue(new Error("fail"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(mediaKeys.detail("media-1"), mockMediaRow);

    const { result } = renderHook(() => useUpdateMedia(mockClient), {
      wrapper,
    });
    result.current.mutate({
      id: "media-1",
      data: { alt_text: "Bad" } as never,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(mediaKeys.detail("media-1"))).toEqual(
      mockMediaRow,
    );
  });
  it("does not throw when there is no prior cache data on error", async () => {
    vi.mocked(updateMedia).mockRejectedValue(new Error("fail"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateMedia(mockClient), {
      wrapper,
    });
    result.current.mutate({
      id: "media-1",
      data: { alt_text: "Bad" } as never,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteMedia", () => {
  it("calls deleteMedia and removes from cache", async () => {
    vi.mocked(deleteMedia).mockResolvedValue(undefined as never);
    vi.mocked(getMedia).mockResolvedValue(mockMediaList as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(mediaKeys.detail("media-1"), mockMediaRow);
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteMedia(mockClient), {
      wrapper,
    });
    result.current.mutate("media-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteMedia).toHaveBeenCalledWith(mockClient, "media-1");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: mediaKeys.detail("media-1") }),
    );
  });
});

describe("useDeleteMediaBulk", () => {
  it("deletes every id and invalidates the media cache once", async () => {
    vi.mocked(deleteMedia).mockResolvedValue(undefined as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(mediaKeys.detail("a"), mockMediaRow);
    queryClient.setQueryData(mediaKeys.detail("b"), mockMediaRow);
    const removeSpy = vi.spyOn(queryClient, "removeQueries");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteMediaBulk(mockClient), {
      wrapper,
    });
    result.current.mutate(["a", "b"]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteMedia).toHaveBeenCalledWith(mockClient, "a");
    expect(deleteMedia).toHaveBeenCalledWith(mockClient, "b");
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: mediaKeys.detail("a") }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mediaKeys.all });
  });
});

describe("useMediaLibrary", () => {
  it("calls getMediaLibraryPage with client and filters", async () => {
    const page = { rows: [], nextCursor: null, hasMore: false };
    vi.mocked(getMediaLibraryPage).mockResolvedValue(page as never);
    const filters = { mediaTypes: ["image" as const] };

    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useMediaLibrary(mockClient, filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMediaLibraryPage).toHaveBeenCalledWith(mockClient, filters);
    expect(result.current.data).toEqual(page);
    expect(queryClient.getQueryData(mediaKeys.library(filters))).toEqual(page);
  });
});

describe("useMediaFacetCounts", () => {
  it("calls getMediaFacetCounts with client and filters", async () => {
    const counts = {
      type: { image: 1, video: 0, audio: 0, document: 0 },
      source: { upload: 1, external: 0 },
      attachedTo: { events: 0, characters: 0, timelines: 0, orphaned: 1 },
    };
    vi.mocked(getMediaFacetCounts).mockResolvedValue(counts as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMediaFacetCounts(mockClient, {}), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMediaFacetCounts).toHaveBeenCalledWith(mockClient, {});
    expect(result.current.data).toEqual(counts);
  });
});

describe("useMediaAttachments", () => {
  it("calls getMediaAttachments with client and id", async () => {
    const attachments = [{ kind: "event", id: "e1", label: "Event" }];
    vi.mocked(getMediaAttachments).mockResolvedValue(attachments as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useMediaAttachments(mockClient, "media-1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMediaAttachments).toHaveBeenCalledWith(mockClient, "media-1");
    expect(result.current.data).toEqual(attachments);
  });
});

describe("useMediaAttachmentsBulk", () => {
  it("calls getMediaAttachmentsBulk for a non-empty id list", async () => {
    vi.mocked(getMediaAttachmentsBulk).mockResolvedValue({
      "media-1": [],
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useMediaAttachmentsBulk(mockClient, ["media-1"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMediaAttachmentsBulk).toHaveBeenCalledWith(mockClient, [
      "media-1",
    ]);
  });

  it("is disabled (does not fetch) for an empty id list", () => {
    vi.mocked(getMediaAttachmentsBulk).mockClear();
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useMediaAttachmentsBulk(mockClient, []),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMediaAttachmentsBulk).not.toHaveBeenCalled();
  });
});

describe("mediaKeys", () => {
  it("produces stable, unique keys", () => {
    expect(mediaKeys.all).toEqual(["media"]);
    expect(mediaKeys.lists()).toEqual(["media", "list"]);
    expect(mediaKeys.detail("media-1")).toEqual(["media", "detail", "media-1"]);
    expect(mediaKeys.signedUrl("media-1", 3600)).toEqual([
      "media",
      "signedUrl",
      "media-1",
      3600,
    ]);
    expect(mediaKeys.library({ search: "q" })).toEqual([
      "media",
      "library",
      { search: "q" },
    ]);
    expect(mediaKeys.facets({})).toEqual(["media", "facets", {}]);
    expect(mediaKeys.attachments("media-1")).toEqual([
      "media",
      "attachments",
      "media-1",
    ]);
    expect(mediaKeys.attachmentsBulk(["a", "b"])).toEqual([
      "media",
      "attachments",
      "bulk",
      ["a", "b"],
    ]);
  });
});

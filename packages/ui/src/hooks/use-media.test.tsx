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
  mediaKeys,
} from "./use-media.js";

vi.mock("@repo/services/media-service.js", () => ({
  getMedia: vi.fn(),
  getMediaById: vi.fn(),
  uploadMedia: vi.fn(),
  createExternalMedia: vi.fn(),
  updateMedia: vi.fn(),
  deleteMedia: vi.fn(),
  getSignedUrl: vi.fn(),
}));

import {
  getMedia,
  getMediaById,
  uploadMedia,
  createExternalMedia,
  updateMedia,
  deleteMedia,
  getSignedUrl,
} from "@repo/services/media-service.js";

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
  });
});

import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types.js";
import {
  getMedia,
  getMediaById,
  uploadMedia,
  createExternalMedia,
  updateMedia,
  deleteMedia,
  getSignedUrl,
} from "./media-service.js";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makeBuilder(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result);
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return builder;
}

/**
 * Build a storage bucket mock.
 *   upload        — resolves with uploadResult
 *   remove        — resolves with removeResult
 *   getPublicUrl  — returns { data: { publicUrl } } synchronously
 *   createSignedUrl — resolves with signedUrlResult
 */
function makeStorageBucket(opts: {
  uploadResult?: { data: unknown; error: unknown };
  removeResult?: { data: unknown; error: unknown };
  publicUrl?: string;
  signedUrlResult?: { data: unknown; error: unknown };
}) {
  return {
    upload: vi
      .fn()
      .mockResolvedValue(opts.uploadResult ?? { data: {}, error: null }),
    remove: vi
      .fn()
      .mockResolvedValue(opts.removeResult ?? { data: {}, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: {
        publicUrl: opts.publicUrl ?? "https://example.com/media/file.jpg",
      },
    }),
    createSignedUrl: vi.fn().mockResolvedValue(
      opts.signedUrlResult ?? {
        data: { signedUrl: "https://signed.url/file.jpg" },
        error: null,
      },
    ),
  };
}

function makeClient(opts: {
  fromResult?: { data: unknown; error: unknown };
  authUser?: { data: { user: unknown }; error: unknown };
  storageBucket?: ReturnType<typeof makeStorageBucket>;
}) {
  const {
    fromResult = { data: null, error: null },
    authUser,
    storageBucket,
  } = opts;
  return {
    from: vi.fn().mockReturnValue(makeBuilder(fromResult)),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue(
          authUser ?? { data: { user: { id: "user-123" } }, error: null },
        ),
    },
    storage: {
      from: vi.fn().mockReturnValue(storageBucket ?? makeStorageBucket({})),
    },
  } as unknown as SupabaseClient<Database>;
}

// uploadMedia / createExternalMedia: call 1 = slug fetch, call 2 = insert
function makeUploadClient(opts: {
  insertResult: { data: unknown; error: unknown };
  storageBucket?: ReturnType<typeof makeStorageBucket>;
}) {
  const slugBuilder = makeBuilder({ data: [], error: null });
  const insertBuilder = makeBuilder(opts.insertResult);
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1 ? slugBuilder : insertBuilder;
    }),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
    storage: {
      from: vi
        .fn()
        .mockReturnValue(opts.storageBucket ?? makeStorageBucket({})),
    },
  } as unknown as SupabaseClient<Database>;
}

// deleteMedia: call 1 = select (fetch storage_path+url), call 2 = delete
function makeDeleteClient(opts: {
  fetchResult: { data: unknown; error: unknown };
  deleteResult?: { data: unknown; error: unknown };
  storageBucket?: ReturnType<typeof makeStorageBucket>;
}) {
  const fetchBuilder = makeBuilder(opts.fetchResult);
  const deleteBuilder = makeBuilder(
    opts.deleteResult ?? { data: null, error: null },
  );
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchBuilder : deleteBuilder;
    }),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
    storage: {
      from: vi
        .fn()
        .mockReturnValue(opts.storageBucket ?? makeStorageBucket({})),
    },
  } as unknown as SupabaseClient<Database>;
}

// ---------------------------------------------------------------------------
// Sample fixtures
// ---------------------------------------------------------------------------

const sampleMedia = {
  id: "media-1",
  user_id: "user-123",
  slug: "sample-image",
  alt_text: "A sample image",
  caption: null,
  storage_path: "user-123/sample.jpg",
  url: "https://example.com/media/user-123/sample.jpg",
  media_type: "image",
  width: 800,
  height: 600,
  file_size_bytes: 102400,
  mime_type: "image/jpeg",
  metadata: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const externalMedia = {
  ...sampleMedia,
  id: "media-2",
  storage_path: "https://external.com/image.jpg",
  url: "https://external.com/image.jpg",
};

// ---------------------------------------------------------------------------
// getMedia
// ---------------------------------------------------------------------------

describe("getMedia", () => {
  it("returns an array of media records", async () => {
    const client = makeClient({
      fromResult: { data: [sampleMedia], error: null },
    });
    expect(await getMedia(client)).toEqual([sampleMedia]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    expect(await getMedia(client)).toEqual([]);
  });

  it("applies userId filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getMedia(client, { userId: "user-abc" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-abc");
  });

  it("applies mediaType filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getMedia(client, { mediaType: "video" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("media_type", "video");
  });

  it("throws on query error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "db error" } },
    });
    await expect(getMedia(client)).rejects.toThrow(
      "MediaService.getMedia: db error",
    );
  });
});

// ---------------------------------------------------------------------------
// getMediaById
// ---------------------------------------------------------------------------

describe("getMediaById", () => {
  it("returns the matching media record", async () => {
    const client = makeClient({
      fromResult: { data: sampleMedia, error: null },
    });
    expect(await getMediaById(client, "media-1")).toEqual(sampleMedia);
  });

  it("throws on error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getMediaById(client, "media-1")).rejects.toThrow(
      "MediaService.getMediaById: not found",
    );
  });
});

// ---------------------------------------------------------------------------
// uploadMedia
// ---------------------------------------------------------------------------

describe("uploadMedia", () => {
  it("uploads the file, inserts a record, and returns the row", async () => {
    const bucket = makeStorageBucket({
      publicUrl: "https://example.com/media/user-123/photo.jpg",
    });
    const client = makeUploadClient({
      insertResult: { data: sampleMedia, error: null },
      storageBucket: bucket,
    });

    const result = await uploadMedia(client, {
      file: new Blob(["data"], { type: "image/jpeg" }),
      fileName: "photo.jpg",
      altText: "A photo",
      mimeType: "image/jpeg",
    });

    expect(result).toEqual(sampleMedia);
    expect(bucket.upload).toHaveBeenCalledWith(
      "user-123/photo.jpg",
      expect.any(Blob),
      expect.objectContaining({ contentType: "image/jpeg" }),
    );
    expect(bucket.getPublicUrl).toHaveBeenCalledWith("user-123/photo.jpg");
  });

  it("throws when storage upload fails", async () => {
    const bucket = makeStorageBucket({
      uploadResult: { data: null, error: { message: "upload failed" } },
    });
    const client = makeUploadClient({
      insertResult: { data: null, error: null },
      storageBucket: bucket,
    });

    await expect(
      uploadMedia(client, { file: new Blob(["x"]), fileName: "bad.jpg" }),
    ).rejects.toThrow("MediaService.uploadMedia.storageUpload: upload failed");
  });

  it("throws when auth fails", async () => {
    const client = makeUploadClient({
      insertResult: { data: null, error: null },
    });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "auth error" },
    });
    await expect(
      uploadMedia(client, { file: new Blob(["x"]), fileName: "file.jpg" }),
    ).rejects.toThrow("MediaService.uploadMedia.getUser: auth error");
  });
});

// ---------------------------------------------------------------------------
// createExternalMedia
// ---------------------------------------------------------------------------

describe("createExternalMedia", () => {
  it("creates a media record with the external URL as storage_path", async () => {
    const client = makeUploadClient({
      insertResult: { data: externalMedia, error: null },
    });
    const result = await createExternalMedia(client, {
      url: "https://external.com/image.jpg",
    });
    expect(result).toEqual(externalMedia);
  });

  it("uses an explicit slug when provided", async () => {
    const client = makeUploadClient({
      insertResult: { data: externalMedia, error: null },
    });
    const result = await createExternalMedia(client, {
      url: "https://external.com/image.jpg",
      slug: "my-external-image",
    });
    expect(result).toEqual(externalMedia);
  });

  it("throws when auth fails", async () => {
    const client = makeUploadClient({
      insertResult: { data: null, error: null },
    });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "auth error" },
    });
    await expect(
      createExternalMedia(client, { url: "https://example.com/img.jpg" }),
    ).rejects.toThrow("MediaService.createExternalMedia.getUser: auth error");
  });
});

// ---------------------------------------------------------------------------
// updateMedia
// ---------------------------------------------------------------------------

describe("updateMedia", () => {
  it("returns the updated media record", async () => {
    const client = makeClient({
      fromResult: { data: sampleMedia, error: null },
    });
    const result = await updateMedia(client, "media-1", {
      alt_text: "Updated",
    });
    expect(result).toEqual(sampleMedia);
  });

  it("throws on validation error", async () => {
    const client = makeClient({ fromResult: { data: null, error: null } });
    await expect(
      // @ts-expect-error intentionally invalid media_type
      updateMedia(client, "media-1", { media_type: "spreadsheet" }),
    ).rejects.toThrow();
  });

  it("throws on DB error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "update failed" } },
    });
    await expect(
      updateMedia(client, "media-1", { alt_text: "X" }),
    ).rejects.toThrow("MediaService.updateMedia: update failed");
  });
});

// ---------------------------------------------------------------------------
// deleteMedia
// ---------------------------------------------------------------------------

describe("deleteMedia", () => {
  it("removes the Storage object and deletes the DB row for hosted media", async () => {
    const bucket = makeStorageBucket({});
    const client = makeDeleteClient({
      fetchResult: {
        data: {
          storage_path: "user-123/photo.jpg",
          url: "https://cdn.example.com/photo.jpg",
        },
        error: null,
      },
      storageBucket: bucket,
    });
    await deleteMedia(client, "media-1");
    expect(bucket.remove).toHaveBeenCalledWith(["user-123/photo.jpg"]);
  });

  it("skips Storage removal for external media (storage_path === url)", async () => {
    const bucket = makeStorageBucket({});
    const externalUrl = "https://external.com/image.jpg";
    const client = makeDeleteClient({
      fetchResult: {
        data: { storage_path: externalUrl, url: externalUrl },
        error: null,
      },
      storageBucket: bucket,
    });
    await deleteMedia(client, "media-2");
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it("throws when fetching the record fails", async () => {
    const client = makeDeleteClient({
      fetchResult: { data: null, error: { message: "not found" } },
    });
    await expect(deleteMedia(client, "media-1")).rejects.toThrow(
      "MediaService.deleteMedia.fetch: not found",
    );
  });

  it("throws when Storage removal fails", async () => {
    const bucket = makeStorageBucket({
      removeResult: { data: null, error: { message: "storage error" } },
    });
    const client = makeDeleteClient({
      fetchResult: {
        data: {
          storage_path: "user-123/photo.jpg",
          url: "https://cdn.example.com/photo.jpg",
        },
        error: null,
      },
      storageBucket: bucket,
    });
    await expect(deleteMedia(client, "media-1")).rejects.toThrow(
      "MediaService.deleteMedia.storageRemove: storage error",
    );
  });

  it("throws when DB delete fails", async () => {
    const client = makeDeleteClient({
      fetchResult: {
        data: {
          storage_path: "https://ext.com/img.jpg",
          url: "https://ext.com/img.jpg",
        },
        error: null,
      },
      deleteResult: { data: null, error: { message: "delete failed" } },
    });
    await expect(deleteMedia(client, "media-1")).rejects.toThrow(
      "MediaService.deleteMedia: delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// getSignedUrl
// ---------------------------------------------------------------------------

describe("getSignedUrl", () => {
  it("returns the signed URL string", async () => {
    // Call 1: fetch storage_path via .select().eq().single()
    const fetchBuilder = makeBuilder({
      data: {
        storage_path: "user-123/private.jpg",
        url: "https://cdn.example.com/private.jpg",
      },
      error: null,
    });
    const bucket = makeStorageBucket({
      signedUrlResult: {
        data: { signedUrl: "https://signed.url/private.jpg" },
        error: null,
      },
    });
    const client = {
      from: vi.fn().mockReturnValue(fetchBuilder),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      storage: { from: vi.fn().mockReturnValue(bucket) },
    } as unknown as SupabaseClient<Database>;

    const url = await getSignedUrl(client, "media-1");
    expect(url).toBe("https://signed.url/private.jpg");
    expect(bucket.createSignedUrl).toHaveBeenCalledWith(
      "user-123/private.jpg",
      3600,
    );
  });

  it("respects a custom expiresIn value", async () => {
    const fetchBuilder = makeBuilder({
      data: {
        storage_path: "user-123/private.jpg",
        url: "https://cdn.example.com/private.jpg",
      },
      error: null,
    });
    const bucket = makeStorageBucket({});
    const client = {
      from: vi.fn().mockReturnValue(fetchBuilder),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      storage: { from: vi.fn().mockReturnValue(bucket) },
    } as unknown as SupabaseClient<Database>;

    await getSignedUrl(client, "media-1", 7200);
    expect(bucket.createSignedUrl).toHaveBeenCalledWith(
      "user-123/private.jpg",
      7200,
    );
  });

  it("throws when fetching the record fails", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "not found" } },
    });
    await expect(getSignedUrl(client, "media-1")).rejects.toThrow(
      "MediaService.getSignedUrl.fetch: not found",
    );
  });

  it("throws when createSignedUrl fails", async () => {
    const fetchBuilder = makeBuilder({
      data: {
        storage_path: "user-123/private.jpg",
        url: "https://cdn.example.com/private.jpg",
      },
      error: null,
    });
    const bucket = makeStorageBucket({
      signedUrlResult: { data: null, error: { message: "signing failed" } },
    });
    const client = {
      from: vi.fn().mockReturnValue(fetchBuilder),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      storage: { from: vi.fn().mockReturnValue(bucket) },
    } as unknown as SupabaseClient<Database>;

    await expect(getSignedUrl(client, "media-1")).rejects.toThrow(
      "MediaService.getSignedUrl.createSignedUrl: signing failed",
    );
  });

  it("returns the public URL directly for external media", async () => {
    const externalUrl = "https://external.com/image.jpg";
    const fetchBuilder = makeBuilder({
      data: { storage_path: externalUrl, url: externalUrl },
      error: null,
    });
    const bucket = makeStorageBucket({});
    const client = {
      from: vi.fn().mockReturnValue(fetchBuilder),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      storage: { from: vi.fn().mockReturnValue(bucket) },
    } as unknown as SupabaseClient<Database>;

    const url = await getSignedUrl(client, "media-2");
    expect(url).toBe(externalUrl);
    expect(bucket.createSignedUrl).not.toHaveBeenCalled();
  });
});

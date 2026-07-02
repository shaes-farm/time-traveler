import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
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
  getOrphanMediaIds,
  getExistingMediaIds,
} from "./media-service";
import { mediaInsertSchema } from "../schemas/media";

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
    in: vi.fn().mockReturnThis(),
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

// deleteMedia: call 1 = select (fetch source+storage_path), call 2 = delete
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
  source: "upload",
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
  source: "external",
  storage_path: null,
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

  it("applies source filter", async () => {
    const client = makeClient({ fromResult: { data: [], error: null } });
    await getMedia(client, { source: "external" });
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.eq).toHaveBeenCalledWith("source", "external");
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

  it("throws when there is no authenticated user", async () => {
    const client = makeUploadClient({
      insertResult: { data: null, error: null },
    });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await expect(
      uploadMedia(client, { file: new Blob(["x"]), fileName: "file.jpg" }),
    ).rejects.toThrow("MediaService.uploadMedia: no authenticated user");
  });

  it("propagates a non-collision insert error", async () => {
    const client = makeUploadClient({
      insertResult: { data: null, error: { message: "insert failed" } },
    });
    await expect(
      uploadMedia(client, { file: new Blob(["x"]), fileName: "file.jpg" }),
    ).rejects.toThrow("MediaService.uploadMedia: insert failed");
  });

  it("retries on a 23505 unique violation and succeeds", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeBuilder({ data: [], error: null });
        if (callCount === 2) {
          return makeBuilder({
            data: null,
            error: { code: "23505", message: "unique violation" },
          });
        }
        return makeBuilder({ data: sampleMedia, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      storage: { from: vi.fn().mockReturnValue(makeStorageBucket({})) },
    } as unknown as SupabaseClient<Database>;

    const result = await uploadMedia(client, {
      file: new Blob(["x"]),
      fileName: "photo.jpg",
    });
    expect(result).toEqual(sampleMedia);
    expect(callCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// createExternalMedia
// ---------------------------------------------------------------------------

describe("createExternalMedia", () => {
  it("creates an external-source record with a null storage_path", async () => {
    const client = makeUploadClient({
      insertResult: { data: externalMedia, error: null },
    });
    const result = await createExternalMedia(client, {
      url: "https://external.com/image.jpg",
    });
    expect(result).toEqual(externalMedia);

    // The insert (second from() call) must mark the row external with no path.
    const insertBuilder = (client.from as ReturnType<typeof vi.fn>).mock
      .results[1]?.value as ReturnType<typeof makeBuilder>;
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ source: "external", storage_path: null }),
    );
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

  it("throws when there is no authenticated user", async () => {
    const client = makeUploadClient({
      insertResult: { data: null, error: null },
    });
    (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await expect(
      createExternalMedia(client, { url: "https://example.com/img.jpg" }),
    ).rejects.toThrow(
      "MediaService.createExternalMedia: no authenticated user",
    );
  });

  it("retries on a 23505 unique violation and succeeds", async () => {
    let callCount = 0;
    const client = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeBuilder({ data: [], error: null });
        if (callCount === 2) {
          return makeBuilder({
            data: null,
            error: { code: "23505", message: "unique violation" },
          });
        }
        return makeBuilder({ data: externalMedia, error: null });
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      storage: { from: vi.fn().mockReturnValue(makeStorageBucket({})) },
    } as unknown as SupabaseClient<Database>;

    const result = await createExternalMedia(client, {
      url: "https://external.com/image.jpg",
    });
    expect(result).toEqual(externalMedia);
    expect(callCount).toBe(3);
  });

  it("propagates a non-collision insert error", async () => {
    const client = makeUploadClient({
      insertResult: { data: null, error: { message: "insert failed" } },
    });
    await expect(
      createExternalMedia(client, { url: "https://external.com/image.jpg" }),
    ).rejects.toThrow("MediaService.createExternalMedia: insert failed");
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
          source: "upload",
          storage_path: "user-123/photo.jpg",
        },
        error: null,
      },
      storageBucket: bucket,
    });
    await deleteMedia(client, "media-1");
    expect(bucket.remove).toHaveBeenCalledWith(["user-123/photo.jpg"]);
  });

  it("skips Storage removal for external media (source = external)", async () => {
    const bucket = makeStorageBucket({});
    const client = makeDeleteClient({
      fetchResult: {
        data: { source: "external", storage_path: null },
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
          source: "upload",
          storage_path: "user-123/photo.jpg",
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
        data: { source: "external", storage_path: null },
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
        source: "upload",
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
        source: "upload",
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
        source: "upload",
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
      data: { source: "external", storage_path: null, url: externalUrl },
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

// ---------------------------------------------------------------------------
// mediaInsertSchema — guard mirrors the DB media_source_storage_ck constraint
// ---------------------------------------------------------------------------

describe("mediaInsertSchema", () => {
  const base = { slug: "x", url: "https://example.com/x.jpg" };

  it("accepts an upload with a storage_path", () => {
    expect(
      mediaInsertSchema.safeParse({
        ...base,
        source: "upload",
        storage_path: "user-123/x.jpg",
      }).success,
    ).toBe(true);
  });

  it("accepts an external embed with no storage_path", () => {
    expect(
      mediaInsertSchema.safeParse({ ...base, source: "external" }).success,
    ).toBe(true);
  });

  it("rejects an upload missing a storage_path", () => {
    expect(
      mediaInsertSchema.safeParse({ ...base, source: "upload" }).success,
    ).toBe(false);
  });

  it("rejects an external embed carrying a storage_path", () => {
    expect(
      mediaInsertSchema.safeParse({
        ...base,
        source: "external",
        storage_path: "user-123/x.jpg",
      }).success,
    ).toBe(false);
  });
});

// ===========================================================================
// Cross-entity media library (#291): getMediaLibraryPage, getMediaFacetCounts,
// attachment map, orphan detection.
// ===========================================================================

interface RecordedCalls {
  select: unknown[][];
  eq: unknown[][];
  in: unknown[][];
  or: string[];
  is: unknown[][];
  not: unknown[][];
  order: unknown[][];
  limit: number[];
}

interface RecordingBuilder {
  calls: RecordedCalls;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => unknown) => Promise<unknown>;
}

/** A chainable PostgREST builder mock that records every filter call so tests
 * can assert the exact query construction, and resolves to a fixed result. */
function makeRecordingBuilder(result: {
  data?: unknown;
  count?: number | null;
  error?: unknown;
}): RecordingBuilder {
  const calls: RecordedCalls = {
    select: [],
    eq: [],
    in: [],
    or: [],
    is: [],
    not: [],
    order: [],
    limit: [],
  };
  const resolved = {
    data: result.data ?? null,
    count: result.count ?? null,
    error: result.error ?? null,
  };
  const builder: RecordingBuilder = {
    calls,
    select: vi.fn((...a: unknown[]) => {
      calls.select.push(a);
      return builder;
    }),
    eq: vi.fn((...a: unknown[]) => {
      calls.eq.push(a);
      return builder;
    }),
    in: vi.fn((...a: unknown[]) => {
      calls.in.push(a);
      return builder;
    }),
    or: vi.fn((f: string) => {
      calls.or.push(f);
      return builder;
    }),
    is: vi.fn((...a: unknown[]) => {
      calls.is.push(a);
      return builder;
    }),
    not: vi.fn((...a: unknown[]) => {
      calls.not.push(a);
      return builder;
    }),
    order: vi.fn((...a: unknown[]) => {
      calls.order.push(a);
      return builder;
    }),
    limit: vi.fn((n: number) => {
      calls.limit.push(n);
      return builder;
    }),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(resolved).then(resolve),
  };
  return builder;
}

/** Build a client whose `from(table)` returns the next queued builder for that
 * table (falling back to an empty result), capturing builders for assertions. */
function makeLibraryClient(
  queues: Record<
    string,
    { data?: unknown; count?: number | null; error?: unknown }[]
  >,
) {
  const builders: Record<string, RecordingBuilder[]> = {};
  const from = vi.fn((table: string) => {
    const queue = queues[table] ?? [];
    const result = queue.shift() ?? { data: [], error: null };
    const b = makeRecordingBuilder(result);
    (builders[table] ??= []).push(b);
    return b;
  });
  const client = { from } as unknown as SupabaseClient<Database>;
  return { client, builders, from };
}

function mediaEmbedRow(opts: {
  id: string;
  slug: string;
  created_at: string;
  events?: number;
  characters?: number;
  timelines?: number;
}) {
  const arr = (n: number) =>
    Array.from({ length: n }, () => ({ media_id: opts.id }));
  return {
    id: opts.id,
    slug: opts.slug,
    created_at: opts.created_at,
    media_type: "image",
    source: "upload",
    event_media: arr(opts.events ?? 0),
    character_media: arr(opts.characters ?? 0),
    timeline_media: arr(opts.timelines ?? 0),
  };
}

describe("getMediaLibraryPage", () => {
  it("builds an escaped, case-insensitive search across alt_text/caption/slug", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, { search: "Curie" });
    const b = builders.media![0]!;
    expect(b.calls.or).toContain(
      "alt_text.ilike.*Curie*,caption.ilike.*Curie*,slug.ilike.*Curie*",
    );
  });

  it("strips PostgREST/ilike metacharacters from the search term", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, { search: "a,b(c)*d%" });
    const b = builders.media![0]!;
    expect(b.calls.or).toContain(
      "alt_text.ilike.*a b c d*,caption.ilike.*a b c d*,slug.ilike.*a b c d*",
    );
  });

  it("omits the search filter when the term is only metacharacters", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, { search: "(),*" });
    const b = builders.media![0]!;
    expect(b.calls.or).toHaveLength(0);
  });

  it("applies Type and Source facets with IN (OR within group)", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      mediaTypes: ["image", "video"],
      sources: ["upload"],
    });
    const b = builders.media![0]!;
    expect(b.calls.in).toContainEqual(["media_type", ["image", "video"]]);
    expect(b.calls.in).toContainEqual(["source", ["upload"]]);
  });

  it("drops facet values that are not in the canonical enum", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      mediaTypes: ["image", "bogus" as never],
    });
    const b = builders.media![0]!;
    expect(b.calls.in).toContainEqual(["media_type", ["image"]]);
  });

  it("filters a single Attached-to kind via not.is.null", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, { attachedTo: ["events"] });
    expect(builders.media![0]!.calls.or).toContain("event_media.not.is.null");
  });

  it("ORs multiple Attached-to kinds within the group, incl. orphaned", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      attachedTo: ["events", "orphaned"],
    });
    expect(builders.media![0]!.calls.or).toContain(
      "event_media.not.is.null,and(event_media.is.null,character_media.is.null,timeline_media.is.null)",
    );
  });

  it("maps the character and timeline Attached-to kinds", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      attachedTo: ["characters", "timelines"],
    });
    expect(builders.media![0]!.calls.or).toContain(
      "character_media.not.is.null,timeline_media.not.is.null",
    );
  });

  it("scopes to userId when supplied", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, { userId: "user-9" });
    expect(builders.media![0]!.calls.eq).toContainEqual(["user_id", "user-9"]);
  });

  it("derives per-card attachment counts from the embed array lengths", async () => {
    const { client } = makeLibraryClient({
      media: [
        {
          data: [
            mediaEmbedRow({
              id: "m1",
              slug: "a",
              created_at: "2026-01-02T00:00:00Z",
              events: 2,
              characters: 1,
              timelines: 0,
            }),
          ],
        },
      ],
    });
    const page = await getMediaLibraryPage(client, {});
    expect(page.rows[0]!.attachmentCounts).toEqual({
      event: 2,
      character: 1,
      timeline: 0,
      total: 3,
    });
    // raw embed arrays are stripped from the returned row
    expect("event_media" in page.rows[0]!).toBe(false);
  });

  it("fetches pageSize+1, sets hasMore, and returns a decodable nextCursor", async () => {
    const rows = [
      mediaEmbedRow({
        id: "m1",
        slug: "a",
        created_at: "2026-01-03T00:00:00Z",
      }),
      mediaEmbedRow({
        id: "m2",
        slug: "b",
        created_at: "2026-01-02T00:00:00Z",
      }),
      mediaEmbedRow({
        id: "m3",
        slug: "c",
        created_at: "2026-01-01T00:00:00Z",
      }),
    ];
    const { client, builders } = makeLibraryClient({ media: [{ data: rows }] });
    const page = await getMediaLibraryPage(client, { pageSize: 2 });
    expect(builders.media![0]!.calls.limit).toEqual([3]);
    expect(page.hasMore).toBe(true);
    expect(page.rows).toHaveLength(2);
    expect(page.nextCursor).toBe(btoa("2026-01-02T00:00:00Z|b"));
  });

  it("returns no cursor on the last page", async () => {
    const rows = [
      mediaEmbedRow({
        id: "m1",
        slug: "a",
        created_at: "2026-01-02T00:00:00Z",
      }),
    ];
    const { client } = makeLibraryClient({ media: [{ data: rows }] });
    const page = await getMediaLibraryPage(client, { pageSize: 2 });
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it("applies a keyset predicate when a cursor is supplied", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      cursor: btoa("2026-01-02T00:00:00Z|b"),
    });
    expect(builders.media![0]!.calls.or).toContain(
      "created_at.lt.2026-01-02T00:00:00Z,and(created_at.eq.2026-01-02T00:00:00Z,slug.lt.b)",
    );
  });

  it("ignores a malformed cursor (degrades to first page)", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, { cursor: "!!!not-base64-with-no-pipe" });
    const keyset = builders.media![0]!.calls.or.filter((c) =>
      c.startsWith("created_at.lt."),
    );
    expect(keyset).toHaveLength(0);
  });

  it("rejects a tampered cursor whose slug injects filter syntax", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    // valid timestamp, but the slug half carries an injected PostgREST clause
    await getMediaLibraryPage(client, {
      cursor: btoa("2026-01-02T00:00:00Z|b,user_id.neq.x"),
    });
    const keyset = builders.media![0]!.calls.or.filter((c) =>
      c.startsWith("created_at.lt."),
    );
    expect(keyset).toHaveLength(0);
  });

  it("rejects a tampered cursor whose timestamp carries metacharacters", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      cursor: btoa("2026-01-02T00:00:00Z),or(id.eq.x|b"),
    });
    const keyset = builders.media![0]!.calls.or.filter((c) =>
      c.startsWith("created_at.lt."),
    );
    expect(keyset).toHaveLength(0);
  });

  it("de-duplicates repeated facet values", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {
      mediaTypes: ["image", "image", "video"],
    });
    expect(builders.media![0]!.calls.in).toContainEqual([
      "media_type",
      ["image", "video"],
    ]);
  });

  it("orders by created_at desc then slug desc", async () => {
    const { client, builders } = makeLibraryClient({ media: [{ data: [] }] });
    await getMediaLibraryPage(client, {});
    expect(builders.media![0]!.calls.order).toEqual([
      ["created_at", { ascending: false }],
      ["slug", { ascending: false }],
    ]);
  });

  it("throws a contextual error on failure", async () => {
    const { client } = makeLibraryClient({
      media: [{ error: { message: "boom" } }],
    });
    await expect(getMediaLibraryPage(client, {})).rejects.toThrow(
      "MediaService.getMediaLibraryPage: boom",
    );
  });
});

describe("getMediaFacetCounts", () => {
  // 10 head-count round-trips, in construction order:
  // image, video, audio, document, upload, external, events, characters,
  // timelines, orphaned.
  const tenCounts = (
    counts: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ],
  ) => ({ media: counts.map((count) => ({ count })) });

  it("maps per-option counts into the facet structure", async () => {
    const { client } = makeLibraryClient(
      tenCounts([181, 22, 9, 36, 212, 36, 100, 50, 30, 4]),
    );
    const result = await getMediaFacetCounts(client, {});
    expect(result.type).toEqual({
      image: 181,
      video: 22,
      audio: 9,
      document: 36,
    });
    expect(result.source).toEqual({ upload: 212, external: 36 });
    expect(result.attachedTo).toEqual({
      events: 100,
      characters: 50,
      timelines: 30,
      orphaned: 4,
    });
  });

  it("excludes a group's own selection from its own counts but keeps it for others", async () => {
    const { client, builders } = makeLibraryClient(
      tenCounts([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
    );
    await getMediaFacetCounts(client, { mediaTypes: ["image"] });
    const media = builders.media!;
    // first 4 builders are the Type counts → must NOT constrain by media_type
    for (let i = 0; i < 4; i++) {
      expect(media[i]!.calls.in).not.toContainEqual(["media_type", ["image"]]);
    }
    // the Source-count builders (indexes 4-5) DO inherit the media_type filter
    expect(media[4]!.calls.in).toContainEqual(["media_type", ["image"]]);
  });

  it("counts orphaned media with all three junctions is.null", async () => {
    const { client, builders } = makeLibraryClient(
      tenCounts([0, 0, 0, 0, 0, 0, 0, 0, 0, 7]),
    );
    await getMediaFacetCounts(client, {});
    const orphanBuilder = builders.media![9]!;
    expect(orphanBuilder.calls.is).toContainEqual(["event_media", null]);
    expect(orphanBuilder.calls.is).toContainEqual(["character_media", null]);
    expect(orphanBuilder.calls.is).toContainEqual(["timeline_media", null]);
  });

  it("throws a contextual error on failure", async () => {
    const { client } = makeLibraryClient({
      media: [{ error: { message: "nope" } }],
    });
    await expect(getMediaFacetCounts(client, {})).rejects.toThrow(
      /MediaService\.getMediaFacetCounts/,
    );
  });
});

describe("getMediaAttachmentsBulk / getMediaAttachments", () => {
  function makeAttachmentClient(opts: {
    events?: unknown[];
    characters?: unknown[];
    timelines?: unknown[];
    error?: {
      table: "event_media" | "character_media" | "timeline_media";
      message: string;
    };
  }) {
    const queues: Record<string, { data?: unknown; error?: unknown }[]> = {
      event_media: [
        opts.error?.table === "event_media"
          ? { error: { message: opts.error.message } }
          : { data: opts.events ?? [] },
      ],
      character_media: [
        opts.error?.table === "character_media"
          ? { error: { message: opts.error.message } }
          : { data: opts.characters ?? [] },
      ],
      timeline_media: [
        opts.error?.table === "timeline_media"
          ? { error: { message: opts.error.message } }
          : { data: opts.timelines ?? [] },
      ],
    };
    return makeLibraryClient(queues);
  }

  it("resolves all three kinds with labels and character is_primary", async () => {
    const { client } = makeAttachmentClient({
      events: [{ media_id: "m1", events: { id: "e1", title: "Polonium" } }],
      characters: [
        {
          media_id: "m1",
          is_primary: true,
          characters: { id: "c1", name: "Curie" },
        },
      ],
      timelines: [
        { media_id: "m1", timelines: { id: "t1", title: "Research" } },
      ],
    });
    const result = await getMediaAttachmentsBulk(client, ["m1"]);
    expect(result.m1).toEqual([
      { kind: "event", id: "e1", label: "Polonium" },
      { kind: "character", id: "c1", label: "Curie", is_primary: true },
      { kind: "timeline", id: "t1", label: "Research" },
    ]);
  });

  it("skips junction rows whose parent is hidden by RLS (null embed)", async () => {
    const { client } = makeAttachmentClient({
      events: [
        { media_id: "m1", events: null },
        { media_id: "m1", events: { id: "e2", title: "Visible" } },
      ],
    });
    const result = await getMediaAttachmentsBulk(client, ["m1"]);
    expect(result.m1).toEqual([{ kind: "event", id: "e2", label: "Visible" }]);
  });

  it("includes an empty array for every input id with no attachments", async () => {
    const { client } = makeAttachmentClient({
      events: [{ media_id: "m1", events: { id: "e1", title: "X" } }],
    });
    const result = await getMediaAttachmentsBulk(client, ["m1", "m2"]);
    expect(result.m2).toEqual([]);
    expect(Object.keys(result).sort()).toEqual(["m1", "m2"]);
  });

  it("returns {} for empty input without a round-trip", async () => {
    const { client, from } = makeLibraryClient({});
    const result = await getMediaAttachmentsBulk(client, []);
    expect(result).toEqual({});
    expect(from).not.toHaveBeenCalled();
  });

  it("getMediaAttachments returns the single id's list", async () => {
    const { client } = makeAttachmentClient({
      characters: [
        {
          media_id: "m1",
          is_primary: false,
          characters: { id: "c1", name: "Curie" },
        },
      ],
    });
    const result = await getMediaAttachments(client, "m1");
    expect(result).toEqual([
      { kind: "character", id: "c1", label: "Curie", is_primary: false },
    ]);
  });

  it("throws a contextual error when a junction query fails", async () => {
    const { client } = makeAttachmentClient({
      error: { table: "character_media", message: "rls" },
    });
    await expect(getMediaAttachmentsBulk(client, ["m1"])).rejects.toThrow(
      "MediaService.getMediaAttachmentsBulk.characters: rls",
    );
  });
});

describe("getOrphanMediaIds", () => {
  it("returns only ids with zero attachments", async () => {
    const queues: Record<string, { data?: unknown; error?: unknown }[]> = {
      event_media: [
        { data: [{ media_id: "m1", events: { id: "e1", title: "X" } }] },
      ],
      character_media: [{ data: [] }],
      timeline_media: [
        { data: [{ media_id: "m3", timelines: { id: "t1", title: "Y" } }] },
      ],
    };
    const { client } = makeLibraryClient(queues);
    const orphans = await getOrphanMediaIds(client, ["m1", "m2", "m3"]);
    expect(orphans).toEqual(["m2"]);
  });

  it("returns [] for empty input", async () => {
    const { client, from } = makeLibraryClient({});
    expect(await getOrphanMediaIds(client, [])).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("getExistingMediaIds", () => {
  it("returns the subset of ids whose media row still exists", async () => {
    const client = makeClient({
      fromResult: { data: [{ id: "m1" }, { id: "m3" }], error: null },
    });
    const alive = await getExistingMediaIds(client, ["m1", "m2", "m3"]);
    expect(alive).toEqual(new Set(["m1", "m3"]));
    const builder = (client.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as ReturnType<typeof makeBuilder>;
    expect(builder.in).toHaveBeenCalledWith("id", ["m1", "m2", "m3"]);
  });

  it("returns an empty set for empty input without a round-trip", async () => {
    const client = makeClient({});
    expect(await getExistingMediaIds(client, [])).toEqual(new Set());
    expect(client.from).not.toHaveBeenCalled();
  });

  it("throws on Supabase error", async () => {
    const client = makeClient({
      fromResult: { data: null, error: { message: "select failed" } },
    });
    await expect(getExistingMediaIds(client, ["m1"])).rejects.toThrow(
      "select failed",
    );
  });
});

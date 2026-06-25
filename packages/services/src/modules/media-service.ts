import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  mediaAttachedToFacetEnum,
  mediaInsertSchema,
  mediaSchema,
  mediaSourceEnum,
  mediaTypeEnum,
} from "../schemas/media";
import type {
  MediaAttachedToFacet,
  MediaAttachment,
  MediaFacetCounts,
  MediaInput,
  MediaLibraryFilters,
} from "../schemas/media";
import { generateSlug, resolveCollision } from "../utils/slug";
import { MAX_SLUG_LENGTH } from "../schemas/slug";
import type { Database } from "../supabase/types";

type MediaRow = Database["public"]["Tables"]["media"]["Row"];

/** Name of the Supabase Storage bucket used for media uploads. */
const MEDIA_BUCKET = "media";

export interface MediaFilters {
  userId?: string;
  mediaType?: z.infer<typeof mediaTypeEnum>;
  source?: z.infer<typeof mediaSourceEnum>;
  page?: number;
  pageSize?: number;
}

/** Input shape for uploading a file to Supabase Storage. */
export interface UploadMediaInput {
  /** The file content to upload. */
  file: File | Blob;
  /** Filename used to derive the storage path and slug. */
  fileName: string;
  altText?: string;
  caption?: string;
  mediaType?: z.infer<typeof mediaTypeEnum>;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  metadata?: Record<string, unknown>;
}

/** Input shape for registering an external (non-hosted) media URL. */
export type CreateExternalMediaInput = {
  /** Publicly accessible URL of the external resource. */
  url: string;
  slug?: string;
  altText?: string;
  caption?: string;
  mediaType?: "image" | "video" | "audio" | "document";
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  metadata?: Record<string, unknown>;
};

function assertNoError(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error !== null) {
    throw new Error(`MediaService.${context}: ${error.message}`);
  }
}

/**
 * Return a paginated list of media records, optionally filtered.
 *
 * @param client - Supabase client instance
 * @param filters - Optional filters: userId, mediaType, page, pageSize
 * @returns Array of media rows ordered by created_at descending
 */
export async function getMedia(
  client: SupabaseClient<Database>,
  filters: MediaFilters = {},
): Promise<MediaRow[]> {
  const { userId, mediaType, source, page, pageSize } = filters;

  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = client
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (userId !== undefined) {
    query = query.eq("user_id", userId);
  }
  if (mediaType !== undefined) {
    query = query.eq("media_type", mediaType);
  }
  if (source !== undefined) {
    query = query.eq("source", source);
  }

  const { data, error } = await query;
  assertNoError(error, "getMedia");
  return data ?? [];
}

/**
 * Fetch a single media record by its UUID.
 *
 * @param client - Supabase client instance
 * @param id - Media UUID
 * @returns The matching media row
 */
export async function getMediaById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<MediaRow> {
  const { data, error } = await client
    .from("media")
    .select("*")
    .eq("id", id)
    .single();
  assertNoError(error, "getMediaById");
  return data;
}

/**
 * Upload a file to Supabase Storage and create the corresponding media record.
 * The storage path is derived as `{userId}/{fileName}`. The public URL is
 * resolved from the bucket's public URL endpoint.
 *
 * @param client - Supabase client instance
 * @param input - Upload input including the file content and metadata
 * @returns The newly created media row
 */
export async function uploadMedia(
  client: SupabaseClient<Database>,
  input: UploadMediaInput,
): Promise<MediaRow> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "uploadMedia.getUser");
  if (user === null) {
    throw new Error("MediaService.uploadMedia: no authenticated user");
  }

  const userId = user.id;
  const storagePath = `${userId}/${input.fileName}`;

  const { error: uploadError } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.mimeType,
      upsert: false,
    });
  assertNoError(uploadError, "uploadMedia.storageUpload");

  const {
    data: { publicUrl },
  } = client.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);

  // Pre-fetch existing slugs to resolve collisions before the insert
  const { data: existing, error: slugError } = await client
    .from("media")
    .select("slug")
    .eq("user_id", userId);
  assertNoError(slugError, "uploadMedia(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  const baseSlug = generateSlug(input.fileName.replace(/\.[^.]+$/, ""));
  const slug = resolveCollision(baseSlug, existingSlugs);

  type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];

  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const validated = mediaInsertSchema.parse({
      slug: attemptSlug,
      source: "upload",
      storage_path: storagePath,
      url: publicUrl,
      alt_text: input.altText,
      caption: input.caption,
      media_type: input.mediaType,
      mime_type: input.mimeType,
      width: input.width,
      height: input.height,
      file_size_bytes: input.fileSizeBytes,
      metadata: input.metadata,
    });

    const { data: row, error: insertError } = await client
      .from("media")
      .insert({
        ...(validated as unknown as MediaInsert),
        user_id: userId,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        const suffix = Math.random().toString(36).slice(2, 6);
        const truncated = slug.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/, "");
        attemptSlug = `${truncated}-${suffix}`;
        continue;
      }
      assertNoError(insertError, "uploadMedia");
    }

    return row as MediaRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("MediaService.uploadMedia: unreachable");
}

/**
 * Create a media record for an externally hosted resource (no Storage upload).
 * The row is marked `source = 'external'` with a NULL `storage_path` — there is
 * no hosted object — which the DB guard (media_source_storage_ck) enforces.
 *
 * @param client - Supabase client instance
 * @param data - External media data including the public URL
 * @returns The newly created media row
 */
export async function createExternalMedia(
  client: SupabaseClient<Database>,
  data: CreateExternalMediaInput,
): Promise<MediaRow> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  assertNoError(authError, "createExternalMedia.getUser");
  if (user === null) {
    throw new Error("MediaService.createExternalMedia: no authenticated user");
  }

  const userId = user.id;

  // Pre-fetch existing slugs to resolve collisions before the insert
  const { data: existing, error: slugError } = await client
    .from("media")
    .select("slug")
    .eq("user_id", userId);
  assertNoError(slugError, "createExternalMedia(fetchSlugs)");

  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  // Derive slug from the URL path segment or the supplied slug
  const urlSegment = data.url.split("/").pop() ?? "media";
  const baseSlug =
    data.slug !== undefined && data.slug.length > 0
      ? data.slug
      : generateSlug(urlSegment.replace(/\.[^.]+$/, "") || "media");
  const slug = resolveCollision(baseSlug, existingSlugs);

  type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];

  const MAX_SLUG_RETRIES = 3;
  let attemptSlug = slug;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    // External media has no Storage object: source='external', storage_path=null
    const validated = mediaInsertSchema.parse({
      slug: attemptSlug,
      source: "external",
      storage_path: null,
      url: data.url,
      alt_text: data.altText,
      caption: data.caption,
      media_type: data.mediaType,
      mime_type: data.mimeType,
      width: data.width,
      height: data.height,
      file_size_bytes: data.fileSizeBytes,
      metadata: data.metadata,
    });

    const { data: row, error: insertError } = await client
      .from("media")
      .insert({
        ...(validated as unknown as MediaInsert),
        user_id: userId,
      })
      .select()
      .single();

    if (insertError !== null) {
      if (insertError.code === "23505" && attempt < MAX_SLUG_RETRIES - 1) {
        const suffix = Math.random().toString(36).slice(2, 6);
        const truncated = slug.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/, "");
        attemptSlug = `${truncated}-${suffix}`;
        continue;
      }
      assertNoError(insertError, "createExternalMedia");
    }

    return row as MediaRow;
  }

  // Unreachable: loop always returns or assertNoError throws
  throw new Error("MediaService.createExternalMedia: unreachable");
}

/**
 * Apply a partial update to a media record.
 *
 * @param client - Supabase client instance
 * @param id - Media UUID
 * @param data - Partial media fields to update
 * @returns The updated media row
 */
export async function updateMedia(
  client: SupabaseClient<Database>,
  id: string,
  data: Partial<MediaInput>,
): Promise<MediaRow> {
  const validated = mediaSchema.partial().parse(data);
  type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];
  const { data: updated, error } = await client
    .from("media")
    .update(validated as unknown as MediaUpdate)
    .eq("id", id)
    .select()
    .single();
  assertNoError(error, "updateMedia");
  return updated;
}

/**
 * Delete a media record and, if it is an uploaded asset, remove its object
 * from Supabase Storage too. External media records (`source = 'external'`,
 * no `storage_path`) only have the DB row deleted.
 *
 * @param client - Supabase client instance
 * @param id - Media UUID
 */
export async function deleteMedia(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  // Fetch the row first to learn its source + storage_path
  const { data: row, error: fetchError } = await client
    .from("media")
    .select("source, storage_path")
    .eq("id", id)
    .single();
  assertNoError(fetchError, "deleteMedia.fetch");

  // Remove the Storage object only for uploaded media (external embeds have no
  // hosted object — storage_path is NULL).
  if (row.source === "upload" && row.storage_path !== null) {
    const { error: storageError } = await client.storage
      .from(MEDIA_BUCKET)
      .remove([row.storage_path]);
    assertNoError(storageError, "deleteMedia.storageRemove");
  }

  const { error } = await client.from("media").delete().eq("id", id);
  assertNoError(error, "deleteMedia");
}

/**
 * Generate a signed URL for a private media object in Supabase Storage.
 *
 * @param client - Supabase client instance
 * @param mediaId - Media UUID
 * @param expiresIn - TTL in seconds (default 3600 = 1 hour)
 * @returns The signed URL string
 */
export async function getSignedUrl(
  client: SupabaseClient<Database>,
  mediaId: string,
  expiresIn = 3600,
): Promise<string> {
  const { data: row, error: fetchError } = await client
    .from("media")
    .select("source, storage_path, url")
    .eq("id", mediaId)
    .single();
  assertNoError(fetchError, "getSignedUrl.fetch");

  // External media has no hosted object (storage_path is NULL): return the
  // public URL directly rather than attempting a signed URL.
  if (row.source === "external" || row.storage_path === null) {
    return row.url;
  }

  const { data, error } = await client.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(row.storage_path, expiresIn);
  assertNoError(error, "getSignedUrl.createSignedUrl");

  return (data as { signedUrl: string }).signedUrl;
}

// ===========================================================================
// Cross-entity media library (screen 17 / #291)
//
// PostgREST construction notes (verified against the live local stack,
// 2026-06-24 — see plan/feature-media-library-query-layer-1.md):
//   • Per-card attachment counts and the "Attached to" filter must share ONE
//     query, so we embed the junctions as plain LEFT joins selecting `media_id`
//     and read the COUNT off the returned array's length. The aggregate
//     `event_media(count)` embed CANNOT be used here: it makes the relationship
//     always non-null, which silently breaks the `is.null` / `not.is.null`
//     attachment filters (they return every row). The plain `!left(media_id)`
//     embed keeps both the count (array length) and a real null/not-null state.
//   • Attached-to filtering: a single kind → `<junction>=not.is.null`; an OR of
//     kinds → `.or("event_media.not.is.null,timeline_media.not.is.null")`;
//     orphaned → all three `is.null` (expressed as `and(...)` inside the OR so
//     it composes with other kinds in the same facet group).
//   • Facet counts use per-option head requests (`count: "exact", head: true`).
// ===========================================================================

const LIBRARY_DEFAULT_PAGE_SIZE = 24;
const LIBRARY_MAX_PAGE_SIZE = 100;

/** Junction → media-row count, plus a convenience total. `total === 0` ⇒ orphan. */
export interface MediaAttachmentCounts {
  event: number;
  character: number;
  timeline: number;
  total: number;
}

/** A media row decorated with its cross-entity attachment counts for the grid. */
export interface MediaLibraryRow extends MediaRow {
  attachmentCounts: MediaAttachmentCounts;
}

/** A page of library results plus the opaque keyset cursor for the next page. */
export interface MediaLibraryPage {
  rows: MediaLibraryRow[];
  /** Opaque cursor to pass back as `filters.cursor` for the next page, or null
   * when this is the last page. */
  nextCursor: string | null;
  hasMore: boolean;
}

/** Shape of the plain `!left(media_id)` junction embeds used by the list query. */
interface LibraryEmbedRow extends MediaRow {
  event_media: { media_id: string }[];
  character_media: { media_id: string }[];
  timeline_media: { media_id: string }[];
}

/** Select clause embedding the three junctions as plain left joins so the count
 * comes from the array length and the null/not-null filters still work. */
const LIBRARY_SELECT =
  "*, event_media(media_id), character_media(media_id), timeline_media(media_id)";

/**
 * Strip characters that would break PostgREST `.or()` filter parsing or change
 * the meaning of the `ilike` pattern (we want a literal substring match):
 * parens, commas, the PostgREST `*` wildcard, the SQL `%`/`_` wildcards, the
 * cast `:` and backslash. Runs of whitespace collapse to one. Returns "" when
 * nothing searchable remains (caller then skips the search filter). This is the
 * free-text analogue of the enum-whitelisting the events service does for its
 * era filter (event-service.ts).
 */
function escapePostgrestSearchTerm(term: string): string {
  return term
    .replace(/[,()*%\\:_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Encode a keyset cursor over (created_at, slug). Both are ASCII, so base64 of
 * `created_at|slug` is safe and URL-portable; slugs never contain `|`. */
function encodeCursor(row: { created_at: string; slug: string }): string {
  return btoa(`${row.created_at}|${row.slug}`);
}

/** Decode a cursor produced by {@link encodeCursor}. Returns null for malformed
 * input so a bad cursor degrades to "first page" rather than throwing. */
function decodeCursor(
  cursor: string,
): { createdAt: string; slug: string } | null {
  try {
    const raw = atob(cursor);
    const sep = raw.indexOf("|");
    if (sep === -1) return null;
    return { createdAt: raw.slice(0, sep), slug: raw.slice(sep + 1) };
  } catch {
    return null;
  }
}

/** Map an "Attached to" facet selection to the OR-clause body referencing the
 * embedded junction resources. Returns null when nothing is selected. */
function buildAttachedToOr(facets: MediaAttachedToFacet[]): string | null {
  const clauses = facets.map((f) => {
    switch (f) {
      case "events":
        return "event_media.not.is.null";
      case "characters":
        return "character_media.not.is.null";
      case "timelines":
        return "timeline_media.not.is.null";
      case "orphaned":
        return "and(event_media.is.null,character_media.is.null,timeline_media.is.null)";
    }
  });
  return clauses.length > 0 ? clauses.join(",") : null;
}

/** Validated, de-duplicated facet selections shared by the list + count queries. */
interface NormalizedFacets {
  search: string;
  mediaTypes: z.infer<typeof mediaTypeEnum>[];
  sources: z.infer<typeof mediaSourceEnum>[];
  attachedTo: MediaAttachedToFacet[];
  userId?: string;
}

/** Validate filter values against the canonical enums before they reach a
 * PostgREST filter string (SEC-002), mirroring the events service's era guard. */
function normalizeFacets(filters: MediaLibraryFilters): NormalizedFacets {
  const mediaTypes = (filters.mediaTypes ?? []).filter(
    (t): t is z.infer<typeof mediaTypeEnum> =>
      mediaTypeEnum.safeParse(t).success,
  );
  const sources = (filters.sources ?? []).filter(
    (s): s is z.infer<typeof mediaSourceEnum> =>
      mediaSourceEnum.safeParse(s).success,
  );
  const attachedTo = (filters.attachedTo ?? []).filter(
    (a): a is MediaAttachedToFacet =>
      mediaAttachedToFacetEnum.safeParse(a).success,
  );
  return {
    search: escapePostgrestSearchTerm(filters.search ?? ""),
    mediaTypes,
    sources,
    attachedTo,
    userId: filters.userId,
  };
}

/**
 * A narrow view of the PostgREST filter-builder surface the library queries
 * use. Typed structurally so both the list (`select`) and count (`head`)
 * builders can flow through {@link applySharedFilters} without `any`.
 */
interface LibraryFilterBuilder<T> {
  eq(column: string, value: string): T;
  in(column: string, values: readonly string[]): T;
  or(filters: string): T;
}

/**
 * Apply the search, Type, Source, Attached-to, and owner filters that are
 * common to the list query and every facet-count query. `skipAttachedTo` is set
 * when counting the Attached-to facet itself (a group never constrains its own
 * counts). Returns the same builder for chaining.
 */
function applySharedFilters<T extends LibraryFilterBuilder<T>>(
  builder: T,
  facets: NormalizedFacets,
  opts: {
    skipMediaTypes?: boolean;
    skipSources?: boolean;
    skipAttachedTo?: boolean;
  } = {},
): T {
  let q = builder;
  if (facets.search.length > 0) {
    q = q.or(
      `alt_text.ilike.*${facets.search}*,caption.ilike.*${facets.search}*,slug.ilike.*${facets.search}*`,
    );
  }
  if (!opts.skipMediaTypes && facets.mediaTypes.length > 0) {
    q = q.in("media_type", facets.mediaTypes);
  }
  if (!opts.skipSources && facets.sources.length > 0) {
    q = q.in("source", facets.sources);
  }
  if (!opts.skipAttachedTo) {
    const attachedOr = buildAttachedToOr(facets.attachedTo);
    if (attachedOr !== null) {
      q = q.or(attachedOr);
    }
  }
  if (facets.userId !== undefined) {
    q = q.eq("user_id", facets.userId);
  }
  return q;
}

/**
 * Return a page of the cross-entity media library: every `media` row the caller
 * can see (RLS applies via `client`), filtered by search + Type/Source/Attached-to
 * facets, with per-card attachment counts and keyset pagination over
 * (created_at desc, slug desc).
 *
 * Facets combine AND across groups and OR within a group. Pass the returned
 * `nextCursor` back as `filters.cursor` to fetch the following page; a null
 * `nextCursor` (and `hasMore === false`) marks the last page.
 */
export async function getMediaLibraryPage(
  client: SupabaseClient<Database>,
  filters: MediaLibraryFilters = {},
): Promise<MediaLibraryPage> {
  const facets = normalizeFacets(filters);
  const pageSize = Math.min(
    LIBRARY_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(filters.pageSize ?? LIBRARY_DEFAULT_PAGE_SIZE)),
  );

  let q = client.from("media").select(LIBRARY_SELECT);
  q = applySharedFilters(
    q as unknown as LibraryFilterBuilder<typeof q>,
    facets,
  ) as unknown as typeof q;

  // Keyset predicate: rows strictly after the cursor in (created_at, slug) desc.
  if (filters.cursor !== undefined) {
    const decoded = decodeCursor(filters.cursor);
    if (decoded !== null) {
      q = q.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},slug.lt.${decoded.slug})`,
      );
    }
  }

  // Fetch one extra row to detect a following page without a separate count.
  q = q
    .order("created_at", { ascending: false })
    .order("slug", { ascending: false })
    .limit(pageSize + 1);

  const { data, error } = await q;
  assertNoError(error, "getMediaLibraryPage");

  const embedRows = (data ?? []) as unknown as LibraryEmbedRow[];
  const hasMore = embedRows.length > pageSize;
  const pageRows = hasMore ? embedRows.slice(0, pageSize) : embedRows;

  const rows: MediaLibraryRow[] = pageRows.map((row) => {
    const { event_media, character_media, timeline_media, ...media } = row;
    const event = event_media.length;
    const character = character_media.length;
    const timeline = timeline_media.length;
    return {
      ...(media as MediaRow),
      attachmentCounts: {
        event,
        character,
        timeline,
        total: event + character + timeline,
      },
    };
  });

  // created_at is typed nullable (DB default now()) but is always present in
  // practice; without it there is no keyset anchor, so fall back to no cursor.
  const last = pageRows.at(-1);
  const nextCursor =
    hasMore && last !== undefined && last.created_at !== null
      ? encodeCursor({ created_at: last.created_at, slug: last.slug })
      : null;

  return { rows, nextCursor, hasMore };
}

/** Builder surface for the per-option count predicates (`.eq`, `.is`, `.not`). */
interface CountPredicateBuilder {
  eq(column: string, value: string): CountPredicateBuilder;
  is(column: string, value: null): CountPredicateBuilder;
  not(column: string, op: string, value: null): CountPredicateBuilder;
}

/** One head-count round-trip: count rows matching the base filters plus `apply`. */
async function countWith(
  client: SupabaseClient<Database>,
  facets: NormalizedFacets,
  skip: {
    skipMediaTypes?: boolean;
    skipSources?: boolean;
    skipAttachedTo?: boolean;
  },
  apply: (q: CountPredicateBuilder) => CountPredicateBuilder,
  context: string,
): Promise<number> {
  const base = client
    .from("media")
    .select(LIBRARY_SELECT, { count: "exact", head: true });
  const filtered = applySharedFilters(
    base as unknown as LibraryFilterBuilder<typeof base>,
    facets,
    skip,
  ) as unknown as typeof base;
  apply(filtered as unknown as CountPredicateBuilder);
  const { count, error } = await filtered;
  assertNoError(error, context);
  return count ?? 0;
}

/**
 * Return per-option counts for the library filter rail. Each facet group is
 * counted with its OWN selection removed (so toggling an option within a group
 * does not zero out its siblings) but with the other groups + search + owner
 * applied — the standard faceted-filter convention.
 */
export async function getMediaFacetCounts(
  client: SupabaseClient<Database>,
  filters: MediaLibraryFilters = {},
): Promise<MediaFacetCounts> {
  const facets = normalizeFacets(filters);

  const typeOptions = mediaTypeEnum.options;
  const sourceOptions = mediaSourceEnum.options;

  const [typeCounts, sourceCounts, events, characters, timelines, orphaned] =
    await Promise.all([
      Promise.all(
        typeOptions.map((t) =>
          countWith(
            client,
            facets,
            { skipMediaTypes: true },
            (q) => q.eq("media_type", t),
            "getMediaFacetCounts.type",
          ),
        ),
      ),
      Promise.all(
        sourceOptions.map((s) =>
          countWith(
            client,
            facets,
            { skipSources: true },
            (q) => q.eq("source", s),
            "getMediaFacetCounts.source",
          ),
        ),
      ),
      countWith(
        client,
        facets,
        { skipAttachedTo: true },
        (q) => q.not("event_media", "is", null),
        "getMediaFacetCounts.attachedTo.events",
      ),
      countWith(
        client,
        facets,
        { skipAttachedTo: true },
        (q) => q.not("character_media", "is", null),
        "getMediaFacetCounts.attachedTo.characters",
      ),
      countWith(
        client,
        facets,
        { skipAttachedTo: true },
        (q) => q.not("timeline_media", "is", null),
        "getMediaFacetCounts.attachedTo.timelines",
      ),
      countWith(
        client,
        facets,
        { skipAttachedTo: true },
        (q) =>
          q
            .is("event_media", null)
            .is("character_media", null)
            .is("timeline_media", null),
        "getMediaFacetCounts.attachedTo.orphaned",
      ),
    ]);

  return {
    type: {
      image: typeCounts[typeOptions.indexOf("image")] ?? 0,
      video: typeCounts[typeOptions.indexOf("video")] ?? 0,
      audio: typeCounts[typeOptions.indexOf("audio")] ?? 0,
      document: typeCounts[typeOptions.indexOf("document")] ?? 0,
    },
    source: {
      upload: sourceCounts[sourceOptions.indexOf("upload")] ?? 0,
      external: sourceCounts[sourceOptions.indexOf("external")] ?? 0,
    },
    attachedTo: {
      events,
      characters,
      timelines,
      orphaned,
    },
  };
}

// ---------------------------------------------------------------------------
// Attachment map + orphan detection (#291 — drives the detail drawer and the
// blast-radius delete preview)
// ---------------------------------------------------------------------------

type EventLabelEmbed = {
  media_id: string;
  events: { id: string; title: string } | null;
};
type CharacterLabelEmbed = {
  media_id: string;
  is_primary: boolean | null;
  characters: { id: string; name: string } | null;
};
type TimelineLabelEmbed = {
  media_id: string;
  timelines: { id: string; title: string } | null;
};

/**
 * Resolve every entity a single media row is attached to, across the three
 * junctions, as a flat list of `{ kind, id, label, is_primary? }`. `is_primary`
 * is populated only for character attachments (read-only here). Junction rows
 * whose parent is hidden by RLS (embedded entity is null) are skipped rather
 * than surfaced with an empty label.
 */
export async function getMediaAttachments(
  client: SupabaseClient<Database>,
  mediaId: string,
): Promise<MediaAttachment[]> {
  const map = await getMediaAttachmentsBulk(client, [mediaId]);
  return map[mediaId] ?? [];
}

/**
 * Bulk variant of {@link getMediaAttachments} for a page of media ids: one
 * round-trip per junction. Every input id appears as a key in the result (with
 * an empty array when it has no attachments), so callers can read counts and
 * orphan state directly. Returns `{}` for empty input without any round-trip.
 */
export async function getMediaAttachmentsBulk(
  client: SupabaseClient<Database>,
  mediaIds: string[],
): Promise<Record<string, MediaAttachment[]>> {
  const result: Record<string, MediaAttachment[]> = {};
  for (const id of mediaIds) {
    result[id] = [];
  }
  if (mediaIds.length === 0) {
    return result;
  }

  const [ev, ch, tl] = await Promise.all([
    client
      .from("event_media")
      .select("media_id, events(id, title)")
      .in("media_id", mediaIds),
    client
      .from("character_media")
      .select("media_id, is_primary, characters(id, name)")
      .in("media_id", mediaIds),
    client
      .from("timeline_media")
      .select("media_id, timelines(id, title)")
      .in("media_id", mediaIds),
  ]);

  assertNoError(ev.error, "getMediaAttachmentsBulk.events");
  assertNoError(ch.error, "getMediaAttachmentsBulk.characters");
  assertNoError(tl.error, "getMediaAttachmentsBulk.timelines");

  const push = (mediaId: string, attachment: MediaAttachment): void => {
    (result[mediaId] ??= []).push(attachment);
  };

  for (const row of (ev.data ?? []) as unknown as EventLabelEmbed[]) {
    if (row.events !== null) {
      push(row.media_id, {
        kind: "event",
        id: row.events.id,
        label: row.events.title,
      });
    }
  }
  for (const row of (ch.data ?? []) as unknown as CharacterLabelEmbed[]) {
    if (row.characters !== null) {
      push(row.media_id, {
        kind: "character",
        id: row.characters.id,
        label: row.characters.name,
        is_primary: row.is_primary ?? false,
      });
    }
  }
  for (const row of (tl.data ?? []) as unknown as TimelineLabelEmbed[]) {
    if (row.timelines !== null) {
      push(row.media_id, {
        kind: "timeline",
        id: row.timelines.id,
        label: row.timelines.title,
      });
    }
  }

  return result;
}

/**
 * Return the subset of `mediaIds` that are orphaned (attached to nothing across
 * all three junctions — the `⛓ 0` cleanup bucket). Derived from the bulk
 * attachment map so it stays consistent with the detail drawer's reuse list.
 */
export async function getOrphanMediaIds(
  client: SupabaseClient<Database>,
  mediaIds: string[],
): Promise<string[]> {
  const map = await getMediaAttachmentsBulk(client, mediaIds);
  return mediaIds.filter((id) => (map[id] ?? []).length === 0);
}

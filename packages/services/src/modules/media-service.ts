import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  mediaInsertSchema,
  mediaSchema,
  mediaSourceEnum,
  mediaTypeEnum,
} from "../schemas/media.js";
import type { MediaInput } from "../schemas/media.js";
import { generateSlug, resolveCollision } from "../utils/slug.js";
import { MAX_SLUG_LENGTH } from "../schemas/slug.js";
import type { Database } from "../supabase/types.js";

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

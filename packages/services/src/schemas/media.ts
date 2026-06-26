import { z } from "zod";
import { slugSchema } from "./slug";

export const mediaTypeEnum = z.enum(["image", "video", "audio", "document"]);

/** Discriminates an uploaded asset (backed by a Storage object) from an
 * externally-hosted URL embed (no stored object). See migration 00018 / #179. */
export const mediaSourceEnum = z.enum(["upload", "external"]);

export const mediaSchema = z.object({
  slug: slugSchema,
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  source: mediaSourceEnum,
  // Uploads carry a Storage object path; external embeds have none (null).
  storage_path: z.string().min(1).nullable().optional(),
  url: z.string().url(),
  media_type: mediaTypeEnum.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  file_size_bytes: z.number().int().nonnegative().optional(),
  mime_type: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Insert-time schema that mirrors the DB guard (media_source_storage_ck):
 * uploads must carry a storage_path; external embeds must not. Use this for
 * create paths; `mediaSchema.partial()` remains available for partial updates
 * (where the DB constraint still enforces the invariant).
 */
export const mediaInsertSchema = mediaSchema.refine(
  (m) =>
    m.source === "upload"
      ? m.storage_path != null && m.storage_path.length > 0
      : m.storage_path == null,
  {
    message:
      "upload media requires a storage_path; external media must not have one",
    path: ["storage_path"],
  },
);

export type MediaInput = z.infer<typeof mediaSchema>;

// ---------------------------------------------------------------------------
// Cross-entity media library (screen 17 / #291)
// ---------------------------------------------------------------------------

/** The three entity kinds a media row can be attached to, via the
 * event_media / character_media / timeline_media junctions. */
export const mediaAttachmentKindEnum = z.enum([
  "event",
  "character",
  "timeline",
]);

/** The "Attached to" facet options. `events|characters|timelines` select media
 * with at least one attachment of that kind; `orphaned` selects media with zero
 * attachments across all three junctions (the `⛓ 0` cleanup bucket). */
export const mediaAttachedToFacetEnum = z.enum([
  "events",
  "characters",
  "timelines",
  "orphaned",
]);

export type MediaAttachmentKind = z.infer<typeof mediaAttachmentKindEnum>;
export type MediaAttachedToFacet = z.infer<typeof mediaAttachedToFacetEnum>;

/**
 * Filters for the cross-entity media library list. Facets combine AND across
 * groups, OR within a group (arrays are OR-ed). `cursor` is an opaque keyset
 * token over (created_at, slug); omit for the first page.
 */
export const mediaLibraryFiltersSchema = z.object({
  /** Case-insensitive substring across alt_text, caption, and slug. */
  search: z.string().optional(),
  /** Type facet — OR within the group. */
  mediaTypes: z.array(mediaTypeEnum).optional(),
  /** Source facet — OR within the group. */
  sources: z.array(mediaSourceEnum).optional(),
  /** Attached-to facet — OR within the group. */
  attachedTo: z.array(mediaAttachedToFacetEnum).optional(),
  /** Scope to a single owner (RLS still applies on top). */
  userId: z.string().uuid().optional(),
  /** Opaque keyset cursor from a previous page's `nextCursor`. */
  cursor: z.string().optional(),
  /** Page size, clamped to [1, 100] by the service (default 24). */
  pageSize: z.number().int().positive().optional(),
});

export type MediaLibraryFilters = z.infer<typeof mediaLibraryFiltersSchema>;

/** A resolved attachment of a media row to one parent entity. `is_primary` is
 * populated only for character attachments (read-only in this cross-entity
 * view); it is undefined for events and timelines. */
export type MediaAttachment = {
  kind: MediaAttachmentKind;
  id: string;
  label: string;
  is_primary?: boolean;
};

/** Per-option facet counts for the library filter rail. */
export type MediaFacetCounts = {
  type: Record<z.infer<typeof mediaTypeEnum>, number>;
  source: Record<z.infer<typeof mediaSourceEnum>, number>;
  attachedTo: Record<MediaAttachedToFacet, number>;
};

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

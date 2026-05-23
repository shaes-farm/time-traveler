import { z } from "zod";
import { slugSchema } from "./slug.js";

export const mediaTypeEnum = z.enum(["image", "video", "audio", "document"]);

export const mediaSchema = z.object({
  slug: slugSchema,
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  storage_path: z.string().min(1),
  url: z.string().url(),
  media_type: mediaTypeEnum.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  file_size_bytes: z.number().int().nonnegative().optional(),
  mime_type: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type MediaInput = z.infer<typeof mediaSchema>;

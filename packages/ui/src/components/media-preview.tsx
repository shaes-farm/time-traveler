"use client";

import { FileText, Music, Play } from "lucide-react";
import type { MediaLibraryRow } from "@repo/services/media-service";

import { cn } from "@repo/ui/lib/utils";

/** Closed `media_type` set; rows may carry a null `media_type`. */
export type MediaTypeKey = "image" | "video" | "audio" | "document";

export const TYPE_LABELS: Record<MediaTypeKey, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
};

/** Map a possibly-null `media_type` onto the closed key set (null ⇒ document). */
export function typeKey(mediaType: string | null): MediaTypeKey {
  switch (mediaType) {
    case "image":
    case "video":
    case "audio":
    case "document":
      return mediaType;
    default:
      return "document";
  }
}

/** Best human label for a media row: alt text → caption → slug. */
export function mediaLabel(item: MediaLibraryRow): string {
  return item.alt_text || item.caption || item.slug;
}

export interface MediaPreviewProps {
  item: MediaLibraryRow;
  typeKey: MediaTypeKey;
  /** Card thumbnail (small square) vs. full 4:3 frame. */
  compact?: boolean;
  /** Override the image source (e.g. a signed URL for a private upload). */
  src?: string;
}

/**
 * Type-degraded media preview — image thumb / video poster + ▶ / audio glyph /
 * document icon, no inline players (screen-17 annotation #10, screen-15 #8).
 * Shared by `MediaCard` (compact) and `MediaDetailDrawer` (full frame).
 */
export function MediaPreview({
  item,
  typeKey: key,
  compact = false,
  src,
}: MediaPreviewProps) {
  const frame = cn(
    "relative flex items-center justify-center overflow-hidden bg-surface-2 text-foreground-muted",
    compact ? "h-14 w-14 shrink-0 rounded-md" : "aspect-[4/3] w-full",
  );

  if (key === "image") {
    return (
      <div className={frame}>
        <img
          src={src ?? item.url}
          alt={item.alt_text ?? ""}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (key === "video") {
    return (
      <div className={cn(frame, "bg-black/60")} data-testid="preview-video">
        <Play className="h-6 w-6 text-white" aria-hidden />
      </div>
    );
  }

  if (key === "audio") {
    return (
      <div className={frame} data-testid="preview-audio">
        <Music className="h-6 w-6" aria-hidden />
      </div>
    );
  }

  return (
    <div className={frame} data-testid="preview-document">
      <FileText className="h-6 w-6" aria-hidden />
    </div>
  );
}

"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  FileText,
  Link2,
  Music,
  Play,
} from "lucide-react";
import type { MediaLibraryRow } from "@repo/services/media-service";

import { cn } from "@repo/ui/lib/utils";
import { Badge } from "@repo/ui/components/badge";

export type MediaPickerMode = "browse" | "pick";
export type MediaView = "grid" | "list";

/** Closed `media_type` set; rows may carry a null `media_type`. */
type MediaTypeKey = "image" | "video" | "audio" | "document";

const TYPE_LABELS: Record<MediaTypeKey, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
};

function typeKey(mediaType: string | null): MediaTypeKey {
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

/** Best human label for the card: alt text → caption → slug. */
function cardLabel(item: MediaLibraryRow): string {
  return item.alt_text || item.caption || item.slug;
}

export interface MediaCardProps {
  item: MediaLibraryRow;
  mode: MediaPickerMode;
  view?: MediaView;
  /** Pick mode only — whether this card is in the selection. */
  selected?: boolean;
  /** Pick mode — toggle selection. */
  onSelect?: (id: string) => void;
  /** Browse mode — open the detail drawer (drawer itself is a later issue). */
  onOpen?: (id: string) => void;
}

/**
 * A single media tile. Type-degraded preview (image thumb / video poster + ▶ /
 * audio glyph / document icon — no inline players), a type badge, the `⛓ N`
 * attachment-count badge, and a `⚠` orphan marker when nothing is attached
 * (`⛓ 0` ⇒ orphan). Browse cards open the detail drawer; pick cards toggle a
 * selection checkbox. See screen-17 annotations #4, #5, #10.
 */
export function MediaCard({
  item,
  mode,
  view = "grid",
  selected = false,
  onSelect,
  onOpen,
}: MediaCardProps) {
  const key = typeKey(item.media_type);
  const label = cardLabel(item);
  const total = item.attachmentCounts.total;
  const isOrphan = total === 0;
  const isList = view === "list";

  const preview = <MediaPreview item={item} typeKey={key} compact={isList} />;

  const meta = (
    <div className={cn("min-w-0", isList ? "flex-1" : "px-2 pb-2 pt-1.5")}>
      <p className="truncate text-sm text-foreground" title={label}>
        {label}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {TYPE_LABELS[key]}
        </Badge>
        <span
          className="inline-flex items-center gap-0.5 text-xs text-foreground-muted"
          title={`Attached to ${total} ${total === 1 ? "entity" : "entities"}`}
        >
          <Link2 className="h-3 w-3" aria-hidden />
          {total}
        </span>
        {isOrphan && (
          <span
            className="inline-flex items-center text-importance-critical"
            title="Orphaned — attached to nothing"
            data-testid="orphan-marker"
          >
            <AlertTriangle className="h-3 w-3" aria-hidden />
            <span className="sr-only">Orphaned</span>
          </span>
        )}
      </div>
    </div>
  );

  const rootClassName = cn(
    "group relative overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isList ? "flex w-full items-center gap-3 p-2" : "block w-full",
  );

  if (mode === "pick") {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={label}
        onClick={() => onSelect?.(item.id)}
        className={cn(
          rootClassName,
          selected && "border-primary ring-2 ring-primary",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-2 top-2 z-10 grid h-5 w-5 place-content-center rounded border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background/80",
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
        {preview}
        {meta}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onOpen?.(item.id)}
      className={rootClassName}
    >
      {preview}
      {meta}
    </button>
  );
}

function MediaPreview({
  item,
  typeKey: key,
  compact,
}: {
  item: MediaLibraryRow;
  typeKey: MediaTypeKey;
  compact: boolean;
}) {
  const frame = cn(
    "relative flex items-center justify-center overflow-hidden bg-surface-2 text-foreground-muted",
    compact ? "h-14 w-14 shrink-0 rounded-md" : "aspect-[4/3] w-full",
  );

  if (key === "image") {
    return (
      <div className={frame}>
        <img
          src={item.url}
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

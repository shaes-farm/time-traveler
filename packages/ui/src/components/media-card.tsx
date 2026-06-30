"use client";

import * as React from "react";
import { AlertTriangle, Check, Link2 } from "lucide-react";
import type { MediaLibraryRow } from "@repo/services/media-service";

import { cn } from "@repo/ui/lib/utils";
import { Badge } from "@repo/ui/components/badge";
import {
  MediaPreview,
  TYPE_LABELS,
  mediaLabel,
  typeKey,
} from "@repo/ui/components/media-preview";

export type MediaPickerMode = "browse" | "pick";
export type MediaView = "grid" | "list";

export interface MediaCardProps {
  item: MediaLibraryRow;
  mode: MediaPickerMode;
  view?: MediaView;
  /** Pick mode, or browse mode with `selectable` — whether this card is in the
   * selection. */
  selected?: boolean;
  /** Pick mode, or browse mode with `selectable` — toggle selection. */
  onSelect?: (id: string) => void;
  /** Browse mode — open the detail drawer. */
  onOpen?: (id: string) => void;
  /** Browse-mode bulk select (orphan cleanup): show a corner checkbox alongside
   * the open action. Pick mode is always selectable and ignores this. */
  selectable?: boolean;
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
  selectable = false,
}: MediaCardProps) {
  const key = typeKey(item.media_type);
  const label = mediaLabel(item);
  const total = item.attachmentCounts.total;
  const isOrphan = total === 0;
  const isList = view === "list";
  // Lets the card button keep `label` as its concise accessible name while still
  // exposing type / attachment count / orphan status to assistive tech.
  const metaId = React.useId();

  const preview = <MediaPreview item={item} typeKey={key} compact={isList} />;

  const meta = (
    <div
      id={metaId}
      className={cn("min-w-0", isList ? "flex-1" : "px-2 pb-2 pt-1.5")}
    >
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
        aria-describedby={metaId}
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

  // Browse-mode bulk select (orphan cleanup): the card body still opens the
  // drawer; a corner checkbox toggles selection without nesting interactives.
  if (selectable) {
    return (
      <div
        className={cn(
          rootClassName,
          selected && "border-primary ring-2 ring-primary",
        )}
      >
        <button
          type="button"
          aria-label={label}
          aria-describedby={metaId}
          onClick={() => onOpen?.(item.id)}
          className={cn(
            "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isList ? "flex w-full items-center gap-3" : "block w-full",
          )}
        >
          {preview}
          {meta}
        </button>
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select ${label}`}
          onClick={() => onSelect?.(item.id)}
          className={cn(
            "absolute left-2 top-2 z-10 grid h-5 w-5 place-content-center rounded border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background/80",
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-describedby={metaId}
      onClick={() => onOpen?.(item.id)}
      className={rootClassName}
    >
      {preview}
      {meta}
    </button>
  );
}

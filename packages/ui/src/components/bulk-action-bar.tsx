"use client";

import * as React from "react";

import { cn } from "@repo/ui/lib/utils";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

/**
 * BulkActionBar — the multi-select action bar for list pages (wireframe
 * docs/design/admin/02-wireframes/16-publish-workflow.md §3).
 *
 * Shows "N selected · [Publish] [Unpublish] [Delete] [Cancel]" for the
 * currently selected rows and routes each transition through a single
 * **batched** confirm dialog ("Publish 4 events?") rather than one dialog per
 * row. `count` is the number of *actionable* (owner-owned) rows — the
 * consumer filters out non-owned/shared rows before passing it, and passes
 * the excluded total as `skippedCount` so the bar can note them. Renders
 * nothing when there is nothing to act on.
 */
export interface BulkActionBarProps {
  /** Number of selected rows the current user may publish/unpublish/delete. */
  count: number;
  /** Singular noun for the entity, e.g. "event" or "timeline". */
  entityLabel?: string;
  /** Plural override; defaults to `entityLabel + "s"`. */
  entityLabelPlural?: string;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
  /** Clear the selection (Cancel). */
  onClear: () => void;
  /** Selected rows excluded because the user does not own them. */
  skippedCount?: number;
  /** Disable actions while a transition is in flight. */
  busy?: boolean;
  className?: string;
}

type PendingAction = "publish" | "unpublish" | "delete" | null;

export function BulkActionBar({
  count,
  entityLabel = "item",
  entityLabelPlural,
  onPublish,
  onUnpublish,
  onDelete,
  onClear,
  skippedCount = 0,
  busy = false,
  className,
}: BulkActionBarProps) {
  const [pending, setPending] = React.useState<PendingAction>(null);

  if (count <= 0) return null;

  const plural = entityLabelPlural ?? `${entityLabel}s`;
  const noun = count === 1 ? entityLabel : plural;

  const confirm = () => {
    // State updates are async, so a rapid double-click could re-enter before
    // the dialog closes; bail if a transition is already in flight.
    if (busy) return;
    if (pending === "publish") onPublish?.();
    else if (pending === "unpublish") onUnpublish?.();
    else if (pending === "delete") onDelete?.();
    setPending(null);
  };

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-2 text-sm",
        className,
      )}
    >
      <span className="font-medium">
        {count} selected
        {skippedCount > 0 && (
          <span className="ml-1 text-foreground-muted">
            ({skippedCount} not yours — skipped)
          </span>
        )}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={busy || !onPublish}
          onClick={() => setPending("publish")}
        >
          Publish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || !onUnpublish}
          onClick={() => setPending("unpublish")}
        >
          Unpublish
        </Button>
        {onDelete && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => setPending("delete")}
          >
            Delete
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Cancel
        </Button>
      </div>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pending === "unpublish"
                ? `Unpublish ${count} ${noun}?`
                : pending === "delete"
                  ? `Delete ${count} ${noun}?`
                  : `Publish ${count} ${noun}?`}
            </DialogTitle>
            <DialogDescription>
              {pending === "unpublish"
                ? `They will revert to drafts and stop appearing in reader-facing views. Visibility is unchanged.`
                : pending === "delete"
                  ? `This cannot be undone.`
                  : `They will appear to readers according to their visibility settings. You can unpublish at any time.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                pending === "unpublish" || pending === "delete"
                  ? "destructive"
                  : "primary"
              }
              disabled={busy}
              onClick={confirm}
            >
              {pending === "unpublish"
                ? "Unpublish"
                : pending === "delete"
                  ? "Delete"
                  : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

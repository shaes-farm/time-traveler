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
import { StatusBadge } from "./status-badge";

/**
 * PublishControl — the canonical publish/unpublish affordance.
 *
 * Publication is **orthogonal to visibility** (PRD §7.11; never merged into a
 * single control): this component only flips the `published` flag and never
 * touches visibility. The current state is always shown via `StatusBadge`; the
 * action is guarded by a confirm dialog. Consumed by the timeline detail header
 * and the event detail header. The action button is owner-only — pass
 * `canPublish={false}` for viewers/collaborators so they still see the badge
 * but not the control.
 */
export interface PublishControlProps {
  published: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  /** Owner-only gate for the action button. Defaults to true. */
  canPublish?: boolean;
  /** When set, the publish button is disabled and this text is shown as visible helper text beside it (and as a native tooltip). Unpublish is unaffected. */
  publishDisabledReason?: string;
  /** Noun used in the confirm copy, e.g. "timeline" or "event". */
  entityLabel?: string;
  className?: string;
}

export function PublishControl({
  published,
  onPublish,
  onUnpublish,
  canPublish = true,
  publishDisabledReason,
  entityLabel = "item",
  className,
}: PublishControlProps) {
  const [open, setOpen] = React.useState(false);
  const reasonId = React.useId();

  const confirm = () => {
    if (published) onUnpublish?.();
    else onPublish?.();
    setOpen(false);
  };

  // The reason only applies to the (enabled→disabled) Publish action, never Unpublish.
  const showReason = canPublish && !published && !!publishDisabledReason;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <StatusBadge status={published ? "published" : "draft"} />
      {canPublish && (
        <Button
          type="button"
          size="sm"
          variant={published ? "secondary" : "primary"}
          onClick={() => setOpen(true)}
          disabled={showReason}
          aria-describedby={showReason ? reasonId : undefined}
          title={!published ? publishDisabledReason : undefined}
        >
          {published ? "Unpublish" : "Publish"}
        </Button>
      )}
      {showReason && (
        <span id={reasonId} className="text-xs text-muted-foreground">
          {publishDisabledReason}
        </span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {published
                ? `Unpublish this ${entityLabel}?`
                : `Publish this ${entityLabel}?`}
            </DialogTitle>
            <DialogDescription>
              {published
                ? `It will revert to a draft and stop appearing in reader-facing views. Visibility is unchanged.`
                : `It will appear to readers according to its visibility setting. Publishing does not change who can see it.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant={published ? "destructive" : "primary"}
              onClick={confirm}
            >
              {published ? "Unpublish" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

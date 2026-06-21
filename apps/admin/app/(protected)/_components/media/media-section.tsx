"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Music,
  MoreHorizontal,
  Plus,
  Star,
  Video,
} from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { useUpdateMedia, useDeleteMedia } from "@repo/ui/hooks/use-media";
import { AttachMediaDialog } from "./attach-media-dialog";

type ServiceClient = Parameters<typeof useUpdateMedia>[0];

export interface AttachedMedia {
  id: string;
  alt_text: string | null;
  caption: string | null;
  media_type: string | null;
  url: string | null;
  source: string;
  /** Junction sort_order; null for character media (ordered by primary only). */
  sort_order: number | null;
  /** Character media only. */
  is_primary?: boolean;
}

export interface MediaSectionProps {
  client: ServiceClient;
  /** Items in display order. */
  items: AttachedMedia[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  canEdit: boolean;
  /**
   * "sort" → events/timelines (move up/down via sort_order).
   * "primary" → characters (set-primary, no reorder).
   */
  ordering: "sort" | "primary";
  /** Persist a new junction row for the newly-created media id. */
  onAttach: (mediaId: string) => Promise<void> | void;
  /** Remove the junction row (media survives). */
  onDetach: (mediaId: string) => Promise<void> | void;
  /** Persist sort_order for an item (ordering="sort" only). */
  onReorder?: (mediaId: string, sortOrder: number) => Promise<void> | void;
  /** Mark an item primary (ordering="primary" only). */
  onSetPrimary?: (mediaId: string) => Promise<void> | void;
  /** Invalidate the caller's media query after an internal edit/delete. */
  onChanged?: () => Promise<void> | void;
}

function MediaThumb({ item }: { item: AttachedMedia }) {
  const [imgError, setImgError] = React.useState(false);
  const base =
    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground";
  if (item.media_type === "image" && item.url && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.alt_text ?? ""}
        className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
        onError={() => setImgError(true)}
      />
    );
  }
  const Icon =
    item.media_type === "video"
      ? Video
      : item.media_type === "audio"
        ? Music
        : FileText;
  return (
    <div className={base}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function MediaSection({
  client,
  items,
  isLoading,
  isError = false,
  onRetry,
  canEdit,
  ordering,
  onAttach,
  onDetach,
  onReorder,
  onSetPrimary,
  onChanged,
}: MediaSectionProps) {
  const updateMedia = useUpdateMedia(client);
  const deleteMedia = useDeleteMedia(client);

  const [attachOpen, setAttachOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<AttachedMedia | null>(null);
  const [editAlt, setEditAlt] = React.useState("");
  const [editCaption, setEditCaption] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<AttachedMedia | null>(
    null,
  );

  function openEdit(item: AttachedMedia) {
    setEditItem(item);
    setEditAlt(item.alt_text ?? "");
    setEditCaption(item.caption ?? "");
  }

  async function handleSaveEdit() {
    if (!editItem) return;
    try {
      await updateMedia.mutateAsync({
        id: editItem.id,
        data: {
          alt_text: editAlt.trim() || undefined,
          caption: editCaption.trim() || undefined,
        },
      });
      await onChanged?.();
      toast.success("Media updated");
      setEditItem(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update media",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMedia.mutateAsync(deleteTarget.id);
      await onChanged?.();
      toast.success("Media deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete media",
      );
    }
  }

  // Reorder by renormalising every item to its index, persisting only the
  // rows whose sort_order actually changed. Robust even when existing rows all
  // share sort_order 0. Mirrors the timeline events move-up/down pattern.
  async function move(index: number, direction: -1 | 1) {
    if (!onReorder) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    try {
      await Promise.all(
        next
          .map((item, i) => ({ item, i }))
          .filter(({ item, i }) => item.sort_order !== i)
          .map(({ item, i }) => onReorder(item.id, i)),
      );
      await onChanged?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reorder media",
      );
      await onChanged?.();
    }
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAttachOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Attach media
          </Button>
        </div>
      )}

      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-8 text-center"
        >
          <p className="text-sm text-destructive">Failed to load media.</p>
          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onRetry()}
            >
              Retry
            </Button>
          )}
        </div>
      ) : isLoading ? (
        <div className="space-y-2 p-1">
          {[1, 2].map((step) => (
            <Skeleton key={step} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm">No media attached.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5"
            >
              <MediaThumb item={item} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.caption ?? item.alt_text ?? "Untitled media"}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>
                    {item.source === "external" ? "external" : "uploaded"}
                  </span>
                  <span>·</span>
                  <span className="capitalize">
                    {item.media_type ?? "media"}
                  </span>
                  {ordering === "primary" && item.is_primary && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      <Star className="mr-0.5 h-3 w-3" />
                      Primary
                    </Badge>
                  )}
                </p>
              </div>

              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0"
                      aria-label="Media actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(item)}>
                      Edit caption / alt
                    </DropdownMenuItem>

                    {ordering === "sort" && (
                      <>
                        <DropdownMenuItem
                          disabled={index === 0}
                          onSelect={() => void move(index, -1)}
                        >
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === items.length - 1}
                          onSelect={() => void move(index, 1)}
                        >
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Move down
                        </DropdownMenuItem>
                      </>
                    )}

                    {ordering === "primary" && !item.is_primary && (
                      <DropdownMenuItem
                        onSelect={() => void onSetPrimary?.(item.id)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as primary
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void onDetach(item.id)}>
                      Detach
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleteTarget(item)}
                    >
                      Delete original
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attach dialog */}
      <AttachMediaDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        client={client}
        onAttached={onAttach}
      />

      {/* Edit caption / alt dialog */}
      <Dialog
        open={editItem !== null}
        onOpenChange={(o) => {
          if (!o) setEditItem(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit media</DialogTitle>
            <DialogDescription>
              Update the alt text and caption. These apply to the media item
              everywhere it is attached.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-alt">Alt text</Label>
              <Input
                id="edit-alt"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-caption">Caption</Label>
              <Textarea
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditItem(null)}
              disabled={updateMedia.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSaveEdit()}
              disabled={updateMedia.isPending}
            >
              {updateMedia.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete-original confirmation (blast radius) */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this media?</DialogTitle>
            <DialogDescription>
              This removes the media item <strong>everywhere</strong> it is
              attached
              {deleteTarget?.source === "external"
                ? "."
                : " and permanently deletes the stored file."}{" "}
              This cannot be undone. To remove it from only this entity, use
              <strong> Detach</strong> instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMedia.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleDelete()}
              disabled={deleteMedia.isPending}
            >
              {deleteMedia.isPending ? "Deleting…" : "Delete original"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

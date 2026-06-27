"use client";

import * as React from "react";
import { AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type { MediaAttachment } from "@repo/services/schemas/media";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Separator } from "@repo/ui/components/separator";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import {
  MediaPreview,
  TYPE_LABELS,
  mediaLabel,
  typeKey,
} from "@repo/ui/components/media-preview";
import {
  useDeleteMedia,
  useDetachMedia,
  useMediaAttachments,
  useUpdateMedia,
} from "@repo/ui/hooks/use-media";

type ServiceClient = Parameters<typeof useMediaAttachments>[0];

export interface MediaDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Supabase service client passed to the media hooks. */
  client: ServiceClient;
  /** The row to inspect — passed straight from the grid to avoid a refetch.
   * `null` while nothing is selected (the drawer renders no body). */
  media: MediaLibraryRow | null;
  /** Called after a successful delete so the consumer can toast / refocus. */
  onDeleted?: (id: string) => void;
}

const KIND_LABELS: Record<MediaAttachment["kind"], string> = {
  character: "Character",
  event: "Event",
  timeline: "Timeline",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Compact "uploaded · image · 1200×800 · 312 KB · image/jpeg" metadata line. */
function metadataParts(media: MediaLibraryRow): string[] {
  const parts: string[] = [
    media.source === "external" ? "external" : "uploaded",
    TYPE_LABELS[typeKey(media.media_type)],
  ];
  if (media.width !== null && media.height !== null) {
    parts.push(`${media.width}×${media.height}`);
  }
  if (media.file_size_bytes !== null) {
    parts.push(formatBytes(media.file_size_bytes));
  }
  if (media.mime_type !== null) {
    parts.push(media.mime_type);
  }
  return parts;
}

/**
 * The Media Library detail drawer (screen 17). Edits the `media` row (alt text,
 * caption, slug — propagating everywhere it's attached), shows the authoritative
 * "Attached to" reuse map with per-entity Detach and a read-only `(primary)`
 * marker, and gates "Delete original" behind a live blast-radius confirm. Mounted
 * only in browse mode — deletion never appears in the picker. Annotations #6–#8.
 */
export function MediaDetailDrawer({
  open,
  onOpenChange,
  client,
  media,
  onDeleted,
}: MediaDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        {media ? (
          // Keyed on the row id so switching items (or closing + reopening the
          // drawer, which unmounts the content) resets the edit form AND any
          // open delete confirm via a fresh mount — no manual reset needed.
          <MediaDetailBody
            key={media.id}
            client={client}
            media={media}
            onClose={() => onOpenChange(false)}
            onDeleted={onDeleted}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function MediaDetailBody({
  client,
  media,
  onClose,
  onDeleted,
}: {
  client: ServiceClient;
  media: MediaLibraryRow;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}) {
  const attachmentsQuery = useMediaAttachments(client, media.id);
  const updateMutation = useUpdateMedia(client);
  const detachMutation = useDetachMedia(client);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const [altText, setAltText] = React.useState(media.alt_text ?? "");
  const [caption, setCaption] = React.useState(media.caption ?? "");
  const [slug, setSlug] = React.useState(media.slug);

  const dirty =
    altText !== (media.alt_text ?? "") ||
    caption !== (media.caption ?? "") ||
    slug !== media.slug;

  const attachments = attachmentsQuery.data ?? [];
  const attachmentCount = attachments.length;

  function handleSave() {
    updateMutation.mutate({
      id: media.id,
      data: { alt_text: altText, caption, slug },
    });
  }

  function handleDetach(attachment: MediaAttachment) {
    detachMutation.mutate({
      kind: attachment.kind,
      mediaId: media.id,
      entityId: attachment.id,
    });
  }

  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle className="font-display text-lg">
          {mediaLabel(media)}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Edit media details, manage its attachments, or delete the original.
        </SheetDescription>
      </SheetHeader>

      {/* Preview + read-only metadata */}
      <div className="mt-4 flex gap-4">
        <div className="w-32 shrink-0 overflow-hidden rounded-md border border-border">
          <MediaPreview item={media} typeKey={typeKey(media.media_type)} />
        </div>
        <dl className="min-w-0 flex-1 space-y-1 text-xs text-foreground-muted">
          <dd>{metadataParts(media).join(" · ")}</dd>
          <dd className="truncate font-mono" title={media.slug}>
            slug: {media.slug}
          </dd>
        </dl>
      </div>

      {/* Editable media-row fields (propagate everywhere it's attached) */}
      <div className="mt-5 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="media-alt">Alt text</Label>
          <Input
            id="media-alt"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="media-caption">Caption</Label>
          <Textarea
            id="media-caption"
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="media-slug">Slug</Label>
          <Input
            id="media-slug"
            className="font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        {updateMutation.isError && (
          <p role="alert" className="text-xs text-destructive">
            Couldn’t save changes. Check the slug and try again.
          </p>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              !dirty || slug.trim().length === 0 || updateMutation.isPending
            }
          >
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      {/* Authoritative "Attached to" reuse map */}
      <section aria-labelledby="attached-heading">
        <h3
          id="attached-heading"
          className="mb-2 text-sm font-medium text-foreground"
        >
          Attached to ({attachmentCount})
        </h3>
        {attachmentsQuery.isPending ? (
          <div className="space-y-2" data-testid="attachments-loading">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : attachmentsQuery.isError ? (
          <p role="alert" className="text-xs text-destructive">
            Couldn’t load attachments.
          </p>
        ) : attachmentCount === 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <AlertTriangle
              className="h-3.5 w-3.5 text-importance-critical"
              aria-hidden
            />
            Not attached to anything — orphaned.
          </p>
        ) : (
          <ul className="space-y-1">
            {attachments.map((a) => (
              <li
                key={`${a.kind}:${a.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-sm">
                  <span className="text-foreground-muted">
                    {KIND_LABELS[a.kind]} —
                  </span>
                  <span className="truncate text-foreground" title={a.label}>
                    {a.label}
                  </span>
                  {a.kind === "character" && a.is_primary && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      primary
                    </Badge>
                  )}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDetach(a)}
                  disabled={detachMutation.isPending}
                >
                  Detach
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator className="my-5" />

      {/* Open source (external only) + blast-radius delete */}
      <div className="flex items-center justify-between gap-2">
        {media.source === "external" ? (
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-2 hover:text-foreground-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Open source
          </a>
        ) : (
          <span />
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete original…
        </Button>
      </div>

      <DeleteOriginalDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        client={client}
        media={media}
        attachmentCount={attachmentCount}
        onDeleted={(id) => {
          setConfirmingDelete(false);
          onClose();
          onDeleted?.(id);
        }}
      />
    </>
  );
}

/**
 * Blast-radius delete confirm. The copy is computed live from the attachment
 * count passed down from the body (which already resolved it for the list), so
 * "removes it everywhere" always matches what the user sees above.
 */
function DeleteOriginalDialog({
  open,
  onOpenChange,
  client,
  media,
  attachmentCount,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ServiceClient;
  media: MediaLibraryRow;
  attachmentCount: number;
  onDeleted: (id: string) => void;
}) {
  const deleteMutation = useDeleteMedia(client);

  function handleDelete() {
    deleteMutation.mutate(media.id, {
      onSuccess: () => onDeleted(media.id),
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this media?</AlertDialogTitle>
          <AlertDialogDescription>
            {attachmentCount === 0
              ? "This media isn’t attached to anything. Deleting removes it permanently — this can’t be undone."
              : `This media is attached to ${attachmentCount} ${
                  attachmentCount === 1 ? "entity" : "entities"
                } — deleting removes it everywhere. This can’t be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete original"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

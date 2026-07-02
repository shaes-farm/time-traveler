"use client";

import * as React from "react";
import { FolderOpen, Images, Link2, UploadCloud } from "lucide-react";
import { getExistingMediaIds } from "@repo/services/media-service";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  useUploadMedia,
  useCreateExternalMedia,
  useDeleteMedia,
} from "@repo/ui/hooks/use-media";
import { ExistingMediaPicker } from "./existing-media-picker";

/** 5 MB — matches the Storage bucket `file_size_limit` and RLS WITH CHECK (00009). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Returns true only for http:// and https:// URLs to block javascript: and data: URIs. */
function isValidHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

type ServiceClient = Parameters<typeof useUploadMedia>[0];
type MediaType = "image" | "video" | "audio" | "document";

/** Infers a coarse media_type from a MIME type or URL extension. */
function inferMediaType(hint: string): MediaType {
  const lower = hint.toLowerCase();
  if (
    lower.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/.test(lower)
  )
    return "image";
  if (
    lower.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|avi)(\?|$)/.test(lower)
  )
    return "video";
  if (
    lower.startsWith("audio/") ||
    /\.(mp3|wav|ogg|flac|m4a)(\?|$)/.test(lower)
  )
    return "audio";
  return "document";
}

export interface AttachMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ServiceClient;
  /** Called with the new media row's id once it has been created. */
  onAttached: (mediaId: string) => Promise<void> | void;
  /**
   * `attach` (default) — attaching to a host entity (writes a junction in
   * `onAttached`); copy says "attach".
   * `library` — the cross-entity Media Library upload-to-orphan path (screen-17
   * annotation #11): the same Upload/External tabs, no attach-to-entity step.
   * `onAttached` should invalidate caches but write no junction, so the new row
   * lands in Orphaned. Copy drops "attach".
   */
  variant?: "attach" | "library";
  /** Which tab opens first. Lets the library's separate Upload / External URL
   * entry points land on the matching tab. */
  defaultTab?: "upload" | "external";
  /**
   * Attach one or more *existing* library media rows to the host entity. When
   * provided (and `variant="attach"`), the dialog shows a third **Existing** tab
   * that embeds the media picker; the host writes the junctions with its own
   * ordering/primary rules and composite-PK dedup (screen-17 annotation #9).
   * Omit it for the `library` variant — upload-to-orphan has no attach step.
   */
  onAttachExisting?: (mediaIds: string[]) => Promise<void> | void;
}

/** Per-variant copy: the library path creates an orphan, so it never says
 * "attached". */
const VARIANT_COPY = {
  attach: {
    title: "Attach media",
    description: "Upload a file or embed media from an external URL.",
    uploadCta: "Upload & attach",
    uploadBusy: "Uploading…",
    uploadSuccess: "Media uploaded and attached",
    externalCta: "Attach",
    externalBusy: "Attaching…",
    externalSuccess: "External media attached",
    existingSuccess: "Media attached",
  },
  library: {
    title: "Add to library",
    description:
      "Upload a file or register an external URL. It lands in your library, unattached, until you add it to an entity.",
    uploadCta: "Upload",
    uploadBusy: "Uploading…",
    uploadSuccess: "Uploaded to library",
    externalCta: "Add",
    externalBusy: "Adding…",
    externalSuccess: "External media added to library",
    // Library variant never shows the Existing tab; present for shape symmetry.
    existingSuccess: "Media attached",
  },
} as const;

/**
 * Attach-media dialog with two tabs: Upload (file → Supabase Storage) and
 * External URL (off-platform embed). Both paths create a `media` row, then
 * hand the new id to `onAttached` so the caller can create the junction row.
 */
export function AttachMediaDialog({
  open,
  onOpenChange,
  client,
  onAttached,
  variant = "attach",
  defaultTab = "upload",
  onAttachExisting,
}: AttachMediaDialogProps) {
  const copy = VARIANT_COPY[variant];
  const upload = useUploadMedia(client);
  const createExternal = useCreateExternalMedia(client);
  const deleteMedia = useDeleteMedia(client);

  // The Existing tab is offered only on the attach-to-entity path, and only
  // when the host supplies a junction writer. The library variant (upload to
  // orphan) has no attach step.
  const showExistingTab = variant === "attach" && Boolean(onAttachExisting);
  const [attachingExisting, setAttachingExisting] = React.useState(false);

  // Upload tab state
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = React.useState("");
  const [uploadCaption, setUploadCaption] = React.useState("");
  const [sizeError, setSizeError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // External tab state
  const [url, setUrl] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [externalAlt, setExternalAlt] = React.useState("");
  const [externalCaption, setExternalCaption] = React.useState("");

  const busy =
    upload.isPending ||
    createExternal.isPending ||
    deleteMedia.isPending ||
    attachingExisting;

  function reset() {
    setFile(null);
    setUploadAlt("");
    setUploadCaption("");
    setSizeError(null);
    setUrl("");
    setUrlError(null);
    setExternalAlt("");
    setExternalCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) reset();
    onOpenChange(next);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_UPLOAD_BYTES) {
      setSizeError("File exceeds the 5 MB limit. Choose a smaller file.");
      setFile(null);
      e.target.value = "";
      return;
    }
    setSizeError(null);
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    let row: { id: string } | null = null;
    try {
      row = await upload.mutateAsync({
        file,
        fileName: `${Date.now()}-${file.name}`,
        altText: uploadAlt.trim() || undefined,
        caption: uploadCaption.trim() || undefined,
        mediaType: inferMediaType(file.type || file.name),
        mimeType: file.type || undefined,
        fileSizeBytes: file.size,
      });
      await onAttached(row.id);
      toast.success(copy.uploadSuccess);
      handleOpenChange(false);
    } catch (err) {
      if (row) {
        try {
          await deleteMedia.mutateAsync(row.id);
        } catch {
          // best-effort cleanup; ignore secondary error
        }
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to upload media",
      );
    }
  }

  function handleUrlChange(value: string) {
    setUrl(value);
    const trimmed = value.trim();
    if (trimmed && !isValidHttpUrl(trimmed)) {
      setUrlError("URL must start with http:// or https://");
    } else {
      setUrlError(null);
    }
  }

  async function handleExternal() {
    const trimmed = url.trim();
    if (!trimmed || !isValidHttpUrl(trimmed)) return;
    let row: { id: string } | null = null;
    try {
      row = await createExternal.mutateAsync({
        url: trimmed,
        altText: externalAlt.trim() || undefined,
        caption: externalCaption.trim() || undefined,
        mediaType: inferMediaType(trimmed),
      });
      await onAttached(row.id);
      toast.success(copy.externalSuccess);
      handleOpenChange(false);
    } catch (err) {
      if (row) {
        try {
          await deleteMedia.mutateAsync(row.id);
        } catch {
          // best-effort cleanup; ignore secondary error
        }
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to attach external media",
      );
    }
  }

  async function handleAttachExisting(mediaIds: string[]) {
    if (!onAttachExisting || mediaIds.length === 0) return;
    setAttachingExisting(true);
    let succeeded = false;
    try {
      // Media can be deleted while the picker is open — revalidate the
      // selection against the live table and drop any that vanished before
      // writing junctions (they would otherwise fail the media_id FK).
      const alive = await getExistingMediaIds(client, mediaIds);
      const survivors = mediaIds.filter((id) => alive.has(id));
      const dropped = mediaIds.length - survivors.length;
      if (dropped > 0) {
        toast.warning(
          `${dropped} selected item${dropped === 1 ? " was" : "s were"} removed and could not be attached.`,
        );
      }
      if (survivors.length === 0) return;
      await onAttachExisting(survivors);
      toast.success(copy.existingSuccess);
      succeeded = true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to attach media",
      );
    } finally {
      setAttachingExisting(false);
    }
    // Close directly rather than via handleOpenChange — the `busy` it guards on
    // is still true in this render's closure.
    if (succeeded) {
      reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={showExistingTab ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <TabsList
            className={
              showExistingTab
                ? "grid w-full grid-cols-3"
                : "grid w-full grid-cols-2"
            }
          >
            <TabsTrigger value="upload">
              <UploadCloud className="mr-1.5 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="external">
              <Link2 className="mr-1.5 h-4 w-4" />
              External URL
            </TabsTrigger>
            {showExistingTab && (
              <TabsTrigger value="existing">
                <Images className="mr-1.5 h-4 w-4" />
                Existing
              </TabsTrigger>
            )}
          </TabsList>

          {/* Upload tab */}
          <TabsContent value="upload" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="media-file">File</Label>
              {/* Native input is visually hidden; the display field + button below trigger it */}
              <input
                ref={fileInputRef}
                id="media-file"
                type="file"
                className="sr-only"
                tabIndex={-1}
                onChange={handleFileChange}
                disabled={busy}
              />
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={file?.name ?? ""}
                  placeholder="No file chosen"
                  className="flex-1 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  aria-label="Choose file"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Images, video, audio, documents · max 5 MB
              </p>
              {sizeError && (
                <p className="text-xs text-destructive" role="alert">
                  {sizeError}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-alt">Alt text</Label>
              <Input
                id="upload-alt"
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
                placeholder="Describe the media for accessibility"
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-caption">Caption</Label>
              <Textarea
                id="upload-caption"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Optional caption or source note"
                disabled={busy}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleUpload()}
                disabled={!file || busy}
              >
                {upload.isPending ? copy.uploadBusy : copy.uploadCta}
              </Button>
            </div>
          </TabsContent>

          {/* External URL tab */}
          <TabsContent value="external" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="media-url">URL</Label>
              <Input
                id="media-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://archive.org/details/…"
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                The file stays hosted off-platform; only a reference is stored.
              </p>
              {urlError && (
                <p className="text-xs text-destructive" role="alert">
                  {urlError}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="external-alt">Alt text</Label>
              <Input
                id="external-alt"
                value={externalAlt}
                onChange={(e) => setExternalAlt(e.target.value)}
                placeholder="Describe the media for accessibility"
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="external-caption">Caption</Label>
              <Textarea
                id="external-caption"
                value={externalCaption}
                onChange={(e) => setExternalCaption(e.target.value)}
                placeholder="Optional caption or source note"
                disabled={busy}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleExternal()}
                disabled={!url.trim() || !!urlError || busy}
              >
                {createExternal.isPending
                  ? copy.externalBusy
                  : copy.externalCta}
              </Button>
            </div>
          </TabsContent>

          {/* Existing tab — reuse a media row already in the library */}
          {showExistingTab && (
            <TabsContent value="existing" className="pt-2">
              <ExistingMediaPicker
                client={client}
                busy={busy}
                onConfirm={handleAttachExisting}
                onCancel={() => handleOpenChange(false)}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

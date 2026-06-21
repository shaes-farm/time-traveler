"use client";

import * as React from "react";
import { FolderOpen, Link2, UploadCloud } from "lucide-react";
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
} from "@repo/ui/hooks/use-media";

/** 5 MB — matches the Storage bucket `file_size_limit` and RLS WITH CHECK (00009). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
}

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
}: AttachMediaDialogProps) {
  const upload = useUploadMedia(client);
  const createExternal = useCreateExternalMedia(client);

  // Upload tab state
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = React.useState("");
  const [uploadCaption, setUploadCaption] = React.useState("");
  const [sizeError, setSizeError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // External tab state
  const [url, setUrl] = React.useState("");
  const [externalAlt, setExternalAlt] = React.useState("");
  const [externalCaption, setExternalCaption] = React.useState("");

  const busy = upload.isPending || createExternal.isPending;

  function reset() {
    setFile(null);
    setUploadAlt("");
    setUploadCaption("");
    setSizeError(null);
    setUrl("");
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
    try {
      const row = await upload.mutateAsync({
        file,
        fileName: `${Date.now()}-${file.name}`,
        altText: uploadAlt.trim() || undefined,
        caption: uploadCaption.trim() || undefined,
        mediaType: inferMediaType(file.type || file.name),
        mimeType: file.type || undefined,
        fileSizeBytes: file.size,
      });
      await onAttached(row.id);
      toast.success("Media uploaded and attached");
      handleOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload media",
      );
    }
  }

  async function handleExternal() {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      const row = await createExternal.mutateAsync({
        url: trimmed,
        altText: externalAlt.trim() || undefined,
        caption: externalCaption.trim() || undefined,
        mediaType: inferMediaType(trimmed),
      });
      await onAttached(row.id);
      toast.success("External media attached");
      handleOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to attach external media",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach media</DialogTitle>
          <DialogDescription>
            Upload a file or embed media from an external URL.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <UploadCloud className="mr-1.5 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="external">
              <Link2 className="mr-1.5 h-4 w-4" />
              External URL
            </TabsTrigger>
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
                {upload.isPending ? "Uploading…" : "Upload & attach"}
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
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://archive.org/details/…"
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                The file stays hosted off-platform; only a reference is stored.
              </p>
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
                disabled={!url.trim() || busy}
              >
                {createExternal.isPending ? "Attaching…" : "Attach"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

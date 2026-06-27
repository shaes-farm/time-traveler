import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MediaLibraryRow } from "@repo/services/media-service";
import type { MediaAttachment } from "@repo/services/schemas/media";

import { Button } from "./button";
import { MediaDetailDrawer } from "./media-detail-drawer";
import { mediaKeys } from "../hooks/use-media";

// The drawer reads attachments through `useMediaAttachments`; seed the query
// cache so the story renders the populated list without a live Supabase client.
const stubClient = {} as unknown as never;

function media(overrides: Partial<MediaLibraryRow>): MediaLibraryRow {
  return {
    id: "curie-lab-1898",
    slug: "marie-curie-lab-1898",
    alt_text: "Marie Curie in her laboratory, 1898",
    caption: "Source: Curie Museum archive",
    url: "https://picsum.photos/seed/curie/640/480",
    source: "upload",
    storage_path: "media/curie.jpg",
    mime_type: "image/jpeg",
    media_type: "image",
    width: 1200,
    height: 800,
    file_size_bytes: 319488,
    metadata: null,
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    attachmentCounts: { event: 1, character: 1, timeline: 1, total: 3 },
    ...overrides,
  };
}

const MULTI = media({});
const ORPHAN = media({
  id: "orphan-sketch",
  slug: "unattached-sketch",
  alt_text: "Unattached sketch",
  caption: null,
  attachmentCounts: { event: 0, character: 0, timeline: 0, total: 0 },
});

const MULTI_ATTACHMENTS: MediaAttachment[] = [
  { kind: "character", id: "c1", label: "Marie Curie", is_primary: true },
  { kind: "event", id: "e1", label: "Discovery of polonium" },
  { kind: "timeline", id: "t1", label: "Radioactivity research" },
];

function Harness({
  row,
  attachments,
}: {
  row: MediaLibraryRow;
  attachments: MediaAttachment[];
}) {
  const [client] = React.useState(() => {
    const qc = new QueryClient();
    qc.setQueryData(mediaKeys.attachments(row.id), attachments);
    return qc;
  });
  const [open, setOpen] = React.useState(true);

  return (
    <QueryClientProvider client={client}>
      <div className="p-8">
        <Button onClick={() => setOpen(true)}>Open detail drawer</Button>
        <MediaDetailDrawer
          open={open}
          onOpenChange={setOpen}
          client={stubClient}
          media={row}
        />
      </div>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof Harness> = {
  title: "Pages/Media Library/Detail Drawer",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Harness>;

export const MultiAttachment: Story = {
  render: () => <Harness row={MULTI} attachments={MULTI_ATTACHMENTS} />,
};

export const Orphan: Story = {
  render: () => <Harness row={ORPHAN} attachments={[]} />,
};

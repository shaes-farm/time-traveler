"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/sonner";
import {
  MediaSection,
  type AttachedMedia,
} from "../../../_components/media/media-section";
import {
  useAddMediaToCharacter,
  useRemoveMediaFromCharacter,
  useSetPrimaryCharacterMedia,
} from "@repo/ui/hooks/use-characters";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";

type ServiceClient = ReturnType<typeof getBrowserSupabaseClient>;

const EMPTY: AttachedMedia[] = [];

interface CharacterMediaTabProps {
  client: ServiceClient;
  characterId: string;
  canEdit: boolean;
}

export function CharacterMediaTab({
  client,
  characterId,
  canEdit,
}: CharacterMediaTabProps) {
  const queryClient = useQueryClient();
  const mediaQueryKey = ["character-media-details", characterId] as const;

  const {
    data: items = EMPTY,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: mediaQueryKey,
    queryFn: async (): Promise<AttachedMedia[]> => {
      const { data: junctions, error: jError } = await client
        .from("character_media")
        .select("media_id, is_primary")
        .eq("character_id", characterId);
      if (jError) throw jError;
      if (!junctions?.length) return [];
      const ids = junctions.map((j) => j.media_id);
      const { data, error } = await client
        .from("media")
        .select("id, alt_text, caption, media_type, url, source")
        .in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((m) => [m.id, m]));
      return (
        junctions
          .map((j): AttachedMedia | null => {
            const m = byId.get(j.media_id);
            if (!m) return null;
            return {
              id: m.id,
              alt_text: m.alt_text,
              caption: m.caption,
              media_type: m.media_type,
              url: m.url,
              source: m.source,
              // Character media has no sort_order — ordering is primary-only.
              sort_order: null,
              is_primary: j.is_primary ?? false,
            };
          })
          .filter((m): m is AttachedMedia => m !== null)
          // Primary first, then stable.
          .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      );
    },
    enabled: !!characterId,
    staleTime: 30_000,
  });

  const addMedia = useAddMediaToCharacter(client);
  const removeMedia = useRemoveMediaFromCharacter(client);
  const setPrimary = useSetPrimaryCharacterMedia(client);

  async function refreshMedia() {
    await queryClient.invalidateQueries({ queryKey: mediaQueryKey });
  }

  // First attached item becomes primary when the character has none yet.
  async function handleAttach(mediaId: string) {
    const isFirst = items.length === 0;
    await addMedia.mutateAsync({ characterId, mediaId, isPrimary: isFirst });
    await refreshMedia();
  }

  async function handleAttachExisting(mediaIds: string[]) {
    const hadNone = items.length === 0;
    await Promise.all(
      mediaIds.map((mediaId, i) =>
        addMedia.mutateAsync({
          characterId,
          mediaId,
          isPrimary: hadNone && i === 0,
        }),
      ),
    );
    await refreshMedia();
  }

  async function handleDetach(mediaId: string) {
    await removeMedia.mutateAsync({ characterId, mediaId });
    await refreshMedia();
  }

  async function handleSetPrimary(mediaId: string) {
    try {
      await setPrimary.mutateAsync({ characterId, mediaId });
      await refreshMedia();
      toast.success("Primary image updated.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to set primary image",
      );
      await refreshMedia();
    }
  }

  return (
    <MediaSection
      client={client}
      items={items}
      isLoading={isPending}
      isError={isError}
      onRetry={() => void refetch()}
      canEdit={canEdit}
      ordering="primary"
      onAttach={handleAttach}
      onAttachExisting={handleAttachExisting}
      onDetach={handleDetach}
      onSetPrimary={handleSetPrimary}
      onChanged={refreshMedia}
    />
  );
}

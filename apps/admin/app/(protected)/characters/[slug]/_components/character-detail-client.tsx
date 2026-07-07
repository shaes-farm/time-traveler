"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/sonner";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { Button, buttonVariants } from "@repo/ui/components/button";
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
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { PublishControl } from "@repo/ui/components/publish-control";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  useCharacterBySlug,
  usePublishCharacter,
  useUnpublishCharacter,
  useDeleteCharacter,
} from "@repo/ui/hooks/use-characters";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";
import {
  CharacterTypeBadge,
  CHARACTER_TYPE_ICON,
  type CharacterType,
} from "@repo/ui/components/character-type-badge";
import { CharacterOverviewTab } from "./character-overview-tab";
import { CharacterEventsTab } from "./character-events-tab";
import { CharacterRelationshipsTab } from "./character-relationships-tab";
import { CharacterMediaTab } from "./character-media-tab";

const SIGNIFICANCE_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function CharacterDetailClient({
  userId,
  slug,
}: {
  userId: string;
  slug: string;
}) {
  const router = useRouter();
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const {
    data: character,
    isPending,
    isError,
  } = useCharacterBySlug(client, userId, slug);

  // Primary media thumbnail for the header — the embedded character_media rows
  // carry only ids, so resolve the primary item's URL separately.
  const characterId = character?.id;
  const { data: primaryMedia } = useQuery({
    queryKey: ["character-primary-media", characterId],
    queryFn: async (): Promise<{
      url: string | null;
      alt: string | null;
    } | null> => {
      if (!characterId) return null;
      const { data: junction, error: jError } = await client
        .from("character_media")
        .select("media_id")
        .eq("character_id", characterId)
        .eq("is_primary", true)
        .maybeSingle();
      if (jError) throw jError;
      if (!junction) return null;
      const { data, error } = await client
        .from("media")
        .select("url, alt_text")
        .eq("id", junction.media_id)
        .maybeSingle();
      if (error) throw error;
      return data ? { url: data.url, alt: data.alt_text } : null;
    },
    enabled: !!characterId,
    staleTime: 30_000,
  });

  const [tab, setTab] = React.useState("overview");
  const [showDelete, setShowDelete] = React.useState(false);
  const [showDangerZone, setShowDangerZone] = React.useState(false);

  const publish = usePublishCharacter(client);
  const unpublish = useUnpublishCharacter(client);
  const deleteCharacter = useDeleteCharacter(client);

  if (isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3, 4].map((step) => (
            <Skeleton key={step} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Character not found.</p>
        <Link
          href="/characters"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Back to characters
        </Link>
      </div>
    );
  }

  const isOwner = character.user_id === userId;
  const canEdit = isOwner;
  const editHref = `/characters/${slug}/edit`;
  const type = character.character_type as CharacterType;
  const TypeIcon = CHARACTER_TYPE_ICON[type];
  const birth = (character.birth_temporal as TemporalData | null) ?? null;
  const death = (character.death_temporal as TemporalData | null) ?? null;

  const relationshipCount = character.character_relationships.length;
  const mediaCount = character.character_media.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Primary media thumbnail */}
        <div className="shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground">
            {primaryMedia?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryMedia.url}
                alt={primaryMedia.alt ?? character.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <TypeIcon className="h-8 w-8" />
            )}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setTab("media")}
              className="mt-1 w-full text-center text-xs text-primary hover:underline"
            >
              Replace
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {character.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CharacterTypeBadge type={type} />
                {character.significance && (
                  <span className="text-xs">
                    {SIGNIFICANCE_LABEL[character.significance] ??
                      character.significance}{" "}
                    significance
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{character.slug}</span>
                {(birth || death) && <span>·</span>}
                {(birth || death) && (
                  <TemporalDisplay
                    value={birth ?? (death as TemporalData)}
                    endValue={birth && death ? death : undefined}
                    format="inline"
                  />
                )}
              </div>
              {character.aliases && character.aliases.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  Also known as: {character.aliases.join(", ")}
                </p>
              )}
              {character.cultural_context &&
                character.cultural_context.length > 0 && (
                  <p className="truncate text-xs text-muted-foreground">
                    {character.cultural_context.join(" · ")}
                  </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <PublishControl
                published={character.published ?? false}
                entityLabel="character"
                canPublish={isOwner}
                onPublish={() =>
                  publish.mutate(character.id, {
                    onSuccess: () => toast.success("Character published."),
                    onError: (err) =>
                      toast.error(
                        err instanceof Error ? err.message : "Publish failed",
                      ),
                  })
                }
                onUnpublish={() =>
                  unpublish.mutate(character.id, {
                    onSuccess: () => toast.success("Character unpublished."),
                    onError: (err) =>
                      toast.error(
                        err instanceof Error ? err.message : "Unpublish failed",
                      ),
                  })
                }
              />
              {canEdit && (
                <Link
                  href={editHref}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  Edit
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      void navigator.clipboard.writeText(character.id)
                    }
                  >
                    Copy ID
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="relationships">
            Relationships ({relationshipCount})
          </TabsTrigger>
          <TabsTrigger value="media">Media ({mediaCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <CharacterOverviewTab character={character} editHref={editHref} />
        </TabsContent>

        <TabsContent value="events" className="pt-4">
          <CharacterEventsTab
            client={client}
            characterId={character.id}
            canEdit={canEdit}
            birthTemporal={birth}
            deathTemporal={death}
          />
        </TabsContent>

        <TabsContent value="relationships" className="pt-4">
          <CharacterRelationshipsTab
            client={client}
            characterId={character.id}
            characterName={character.name}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="media" className="pt-4">
          <CharacterMediaTab
            client={client}
            characterId={character.id}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>

      {/* Danger zone */}
      {isOwner && (
        <div className="rounded-md border border-destructive/30">
          <button
            type="button"
            aria-expanded={showDangerZone}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/5"
            onClick={() => setShowDangerZone((v) => !v)}
          >
            {showDangerZone ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Danger zone
          </button>
          {showDangerZone && (
            <div className="border-t border-destructive/20 px-4 pb-4 pt-1">
              <p className="mb-3 text-xs text-muted-foreground">
                Deleting a character is permanent and cannot be undone. All
                relationships, event participation, and media associations will
                be removed.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                Delete character
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={showDelete}
        onOpenChange={(o) => {
          if (!o) setShowDelete(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete character?</DialogTitle>
            <DialogDescription>
              <strong>{character.name}</strong> and all its junction data
              (relationships, event participation, media links) will be
              permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(false)}
              disabled={deleteCharacter.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteCharacter.isPending}
              onClick={() =>
                deleteCharacter.mutate(character.id, {
                  onSuccess: () => {
                    toast.success("Character deleted.");
                    router.push("/characters");
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Delete failed",
                    ),
                })
              }
            >
              {deleteCharacter.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

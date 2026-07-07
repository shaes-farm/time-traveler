"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";

import {
  storyKeys,
  useStoryBySlug,
  usePublishStory,
  useUnpublishStory,
  useDeleteStory,
} from "@repo/ui/hooks/use-stories";
import { useCharacters } from "@repo/ui/hooks/use-characters";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  CharacterTypeBadge,
  type CharacterType,
} from "@repo/ui/components/character-type-badge";

import { StoryEventsTab } from "./story-events-tab";
import { StoryCharactersTab } from "./story-characters-tab";
import { StoryPeriodsTab } from "./story-periods-tab";

const NARRATOR_LABEL: Record<string, string> = {
  first_person: "First-person",
  third_person: "Third-person",
  omniscient: "Omniscient",
};

export function StoryDetailClient({
  userId,
  slug,
}: {
  userId: string;
  slug: string;
}) {
  const router = useRouter();
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const queryClient = useQueryClient();

  const {
    data: story,
    isPending,
    isError,
  } = useStoryBySlug(client, userId, slug);

  // Resolve the perspective character's identity for the header voice line.
  // Shares the cache key with the tabs' character query.
  const { data: characters = [] } = useCharacters(
    client,
    { userId, pageSize: 100, sortBy: "name" },
    { enabled: userId !== "" },
  );

  const [tab, setTab] = React.useState("events");
  const [showDelete, setShowDelete] = React.useState(false);
  const [showDangerZone, setShowDangerZone] = React.useState(false);

  const publish = usePublishStory(client);
  const unpublish = useUnpublishStory(client);
  const deleteStory = useDeleteStory(client);

  // Junction mutations invalidate storyKeys.detail(id), but this page reads via
  // bySlug — refresh that query after a tab mutation.
  const refreshStory = React.useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: storyKeys.bySlug(userId, slug),
    });
  }, [queryClient, userId, slug]);

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

  if (isError || !story) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Story not found.</p>
        <Link
          href="/stories"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Back to stories
        </Link>
      </div>
    );
  }

  const isOwner = story.user_id === userId;
  const canEdit = isOwner;
  const editHref = `/stories/${slug}/edit`;
  const isFirstPerson = story.narrator_type === "first_person";

  const perspective =
    story.perspective_character_id !== null
      ? (characters.find((c) => c.id === story.perspective_character_id) ??
        null)
      : null;

  const storyCharacters = story.story_characters ?? [];
  const storyPeriods = story.story_periods ?? [];
  const eventCount = story.story_events?.length ?? 0;

  const hasProse =
    (story.summary && story.summary.length > 0) ||
    (story.detail && story.detail.length > 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/stories" className="hover:text-foreground">
              Stories
            </Link>
            <span aria-hidden>▸</span>
          </nav>
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {story.title}
          </h1>
          {story.sub_title && (
            <p className="truncate text-sm text-muted-foreground">
              {story.sub_title}
            </p>
          )}
          {/* Voice line. Publication state is carried by PublishControl on the
              right, so it is intentionally not repeated here. */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {story.narrator_type
                ? (NARRATOR_LABEL[story.narrator_type] ?? story.narrator_type)
                : "—"}
            </span>
            {perspective && (
              <>
                <span aria-hidden>· through</span>
                <CharacterTypeBadge
                  type={perspective.character_type as CharacterType}
                  label={perspective.name}
                />
              </>
            )}
            <span className="font-mono">· {story.slug}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PublishControl
            published={story.published ?? false}
            entityLabel="story"
            canPublish={isOwner}
            onPublish={() =>
              publish.mutate(story.id, {
                onSuccess: () => toast.success("Story published."),
                onError: (err) =>
                  toast.error(
                    err instanceof Error ? err.message : "Publish failed",
                  ),
              })
            }
            onUnpublish={() =>
              unpublish.mutate(story.id, {
                onSuccess: () => toast.success("Story unpublished."),
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
              className={buttonVariants({ variant: "secondary", size: "sm" })}
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
                onClick={() => void navigator.clipboard.writeText(story.id)}
              >
                Copy ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Prose body (summary + detail). Rendered as plain text with preserved
          whitespace — rich Markdown rendering is a non-goal for the admin app. */}
      {hasProse ? (
        <div className="space-y-3">
          {story.summary && (
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {story.summary}
            </p>
          )}
          {story.detail && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {story.detail}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No prose written yet.</p>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="events">Events ({eventCount})</TabsTrigger>
          <TabsTrigger value="characters">
            Characters ({storyCharacters.length})
          </TabsTrigger>
          <TabsTrigger value="periods">
            Periods ({storyPeriods.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="pt-4">
          <StoryEventsTab
            client={client}
            storyId={story.id}
            userId={userId}
            canEdit={canEdit}
            onMutated={refreshStory}
          />
        </TabsContent>

        <TabsContent value="characters" className="pt-4">
          <StoryCharactersTab
            client={client}
            storyId={story.id}
            userId={userId}
            canEdit={canEdit}
            storyCharacters={storyCharacters}
            isFirstPerson={isFirstPerson}
            onMutated={refreshStory}
          />
        </TabsContent>

        <TabsContent value="periods" className="pt-4">
          <StoryPeriodsTab
            client={client}
            storyId={story.id}
            userId={userId}
            canEdit={canEdit}
            storyPeriods={storyPeriods}
            onMutated={refreshStory}
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
                Deleting a story is permanent and cannot be undone. Its event,
                character, and period associations will be removed (the events,
                characters, and periods themselves are untouched).
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                Delete story
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
            <DialogTitle>Delete story?</DialogTitle>
            <DialogDescription>
              <strong>{story.title}</strong> and all its associations will be
              permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(false)}
              disabled={deleteStory.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteStory.isPending}
              onClick={() =>
                deleteStory.mutate(story.id, {
                  onSuccess: () => {
                    toast.success("Story deleted.");
                    router.push("/stories");
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Delete failed",
                    ),
                })
              }
            >
              {deleteStory.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

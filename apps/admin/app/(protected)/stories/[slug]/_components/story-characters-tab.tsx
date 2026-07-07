"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/services/supabase/types";
import type {
  StoryCharacterRole,
  StoryWithRelations,
} from "@repo/services/story-service";
import {
  useAddCharacterToStory,
  useRemoveCharacterFromStory,
  useUpdateStoryCharacterRole,
} from "@repo/ui/hooks/use-stories";
import { useCharacters } from "@repo/ui/hooks/use-characters";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import {
  CharacterTypeBadge,
  type CharacterType,
} from "@repo/ui/components/character-type-badge";

type ServiceClient = SupabaseClient<Database>;
type StoryCharacterRow = NonNullable<
  StoryWithRelations["story_characters"]
>[number];

const ROLE_OPTIONS: { value: StoryCharacterRole; label: string }[] = [
  { value: "protagonist", label: "Protagonist" },
  { value: "supporting", label: "Supporting" },
  { value: "mentioned", label: "Mentioned" },
  { value: "narrator", label: "Narrator" },
];

type CharacterInfo = { name: string; character_type: CharacterType };

export function StoryCharactersTab({
  client,
  storyId,
  userId,
  canEdit,
  storyCharacters,
  isFirstPerson,
  onMutated,
}: {
  client: ServiceClient;
  storyId: string;
  userId: string;
  canEdit: boolean;
  storyCharacters: StoryCharacterRow[];
  isFirstPerson: boolean;
  onMutated: () => void;
}) {
  const { data: characters = [], isPending } = useCharacters(
    client,
    { userId, pageSize: 100, sortBy: "name" },
    { enabled: userId !== "" },
  );

  const infoMap = React.useMemo(() => {
    const map = new Map<string, CharacterInfo>();
    for (const c of characters) {
      map.set(c.id, {
        name: c.name,
        character_type: c.character_type as CharacterType,
      });
    }
    return map;
  }, [characters]);

  const addCharacter = useAddCharacterToStory(client);
  const removeCharacter = useRemoveCharacterFromStory(client);
  const updateRole = useUpdateStoryCharacterRole(client);

  const linkedIds = React.useMemo(
    () => new Set(storyCharacters.map((sc) => sc.character_id)),
    [storyCharacters],
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const candidates = characters.filter((c) => !linkedIds.has(c.id));

  function handleAdd(characterId: string) {
    addCharacter.mutate(
      { storyId, characterId, role: "mentioned" },
      {
        onSuccess: () => {
          toast.success("Character added to story.");
          onMutated();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't add character.",
          ),
      },
    );
  }

  function handleRoleChange(characterId: string, role: StoryCharacterRole) {
    updateRole.mutate(
      { storyId, characterId, role },
      {
        onSuccess: onMutated,
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't update role.",
          ),
      },
    );
  }

  function handleRemove(sc: StoryCharacterRow) {
    removeCharacter.mutate(
      { storyId, characterId: sc.character_id },
      {
        onSuccess: () => {
          // Soft, non-blocking warning: removing the narrator of a first-person
          // story leaves the voice without its point-of-view character.
          if (isFirstPerson && sc.role_in_story === "narrator") {
            toast.warning(
              "Removed the narrator of a first-person story — set a new perspective character in the editor.",
            );
          } else {
            toast.success("Character removed from story.");
          }
          onMutated();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Couldn't remove character.",
          ),
      },
    );
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="mr-1.5 h-4 w-4" />
                Add character
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search characters…" />
                <CommandList>
                  <CommandEmpty>
                    {isPending ? "Loading…" : "No characters found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {candidates.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                          handleAdd(c.id);
                          setPickerOpen(false);
                        }}
                      >
                        <CharacterTypeBadge
                          type={c.character_type as CharacterType}
                          label={c.name}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {storyCharacters.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm">No characters in this story yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {storyCharacters.map((sc) => {
            const info = infoMap.get(sc.character_id);
            const role = (sc.role_in_story ??
              "mentioned") as StoryCharacterRole;
            return (
              <div
                key={sc.character_id}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {info ? (
                    <CharacterTypeBadge
                      type={info.character_type}
                      label={info.name}
                    />
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      {sc.character_id}
                    </span>
                  )}
                </div>
                {canEdit ? (
                  <select
                    value={role}
                    onChange={(e) =>
                      handleRoleChange(
                        sc.character_id,
                        e.target.value as StoryCharacterRole,
                      )
                    }
                    aria-label="Role in story"
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs capitalize text-muted-foreground">
                    {role}
                  </span>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemove(sc)}
                    aria-label="Remove character"
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { RelationshipCard } from "@repo/ui/components/relationship-card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/sonner";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";
import {
  useCharacterRelationships,
  useDeleteRelationship,
} from "@repo/ui/hooks/use-character-relationships";
import { useRelationshipVocabulary } from "@repo/ui/hooks/use-relationship-types";
import type { RelationshipType } from "@repo/ui/components/relationship-type-selector";
import {
  directionLabel,
  groupRelationshipsByFamily,
  initials,
  otherCharacterId,
  type RelationshipLike,
} from "../../_components/character-detail-helpers";
import {
  AddRelationshipSheet,
  type RelationshipEditTarget,
} from "./add-relationship-sheet";

type ServiceClient = ReturnType<typeof getBrowserSupabaseClient>;

interface OtherCharacterInfo {
  id: string;
  name: string;
  slug: string;
  character_type: string;
}

interface CharacterRelationshipsTabProps {
  client: ServiceClient;
  characterId: string;
  characterName: string;
  canEdit: boolean;
}

export function CharacterRelationshipsTab({
  client,
  characterId,
  characterName,
  canEdit,
}: CharacterRelationshipsTabProps) {
  const {
    data: relationships = [],
    isPending,
    isError,
    refetch,
  } = useCharacterRelationships(
    client,
    characterId,
    {},
    { enabled: !!characterId },
  );

  const deleteRel = useDeleteRelationship(client);

  // Resolve the names/types of the characters on the other end of each edge.
  const otherIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const rel of relationships) {
      ids.add(otherCharacterId(rel, characterId));
    }
    return [...ids];
  }, [relationships, characterId]);

  const { data: otherChars = [] } = useQuery({
    queryKey: ["relationship-other-characters", characterId, otherIds],
    queryFn: async (): Promise<OtherCharacterInfo[]> => {
      if (otherIds.length === 0) return [];
      const { data, error } = await client
        .from("characters")
        .select("id, name, slug, character_type")
        .in("id", otherIds);
      if (error) throw error;
      return (data ?? []) as OtherCharacterInfo[];
    },
    enabled: otherIds.length > 0,
    staleTime: 60_000,
  });

  const nameById = React.useMemo(() => {
    const map = new Map<string, OtherCharacterInfo>();
    for (const c of otherChars) map.set(c.id, c);
    return map;
  }, [otherChars]);

  // Grouping and the narrative direction lines are both driven by the
  // relationship vocabulary (#419) rather than hard-coded maps.
  const { vocabulary, categories } = useRelationshipVocabulary(client);

  const groups = React.useMemo(
    () =>
      groupRelationshipsByFamily(
        relationships as RelationshipLike[],
        categories,
        vocabulary,
      ),
    [relationships, categories, vocabulary],
  );

  // Collapsible group state — all expanded by default.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(
    () => new Set(),
  );
  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Sheet + delete state.
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RelationshipEditTarget | null>(
    null,
  );
  const [initialOther, setInitialOther] = React.useState<{
    id: string;
    name: string;
    characterType: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<RelationshipLike | null>(null);

  const existingLinks = React.useMemo(
    () =>
      relationships.map((rel) => ({
        otherId: otherCharacterId(rel, characterId),
        type: rel.relationship_type,
      })),
    [relationships, characterId],
  );

  function openAdd() {
    setEditing(null);
    setInitialOther(null);
    setSheetOpen(true);
  }

  function openEdit(rel: RelationshipLike) {
    const otherId = otherCharacterId(rel, characterId);
    setEditing({
      id: rel.id,
      otherId,
      otherName: nameById.get(otherId)?.name ?? "Unknown character",
      type: rel.relationship_type as RelationshipType,
      role: rel.relationship_role,
      description: rel.description,
      startTemporal: (rel.start_temporal as TemporalData | null) ?? null,
      endTemporal: (rel.end_temporal as TemporalData | null) ?? null,
    });
    setInitialOther(null);
    setSheetOpen(true);
  }

  function openDuplicate(rel: RelationshipLike) {
    const otherId = otherCharacterId(rel, characterId);
    const info = nameById.get(otherId);
    setEditing(null);
    setInitialOther({
      id: otherId,
      name: info?.name ?? "Unknown character",
      characterType: info?.character_type ?? "",
    });
    setSheetOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteRel.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Relationship deleted.");
        setDeleteTarget(null);
        void refetch();
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to delete relationship",
        ),
    });
  }

  if (isPending) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2, 3].map((step) => (
          <Skeleton key={step} className="h-24 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-8 text-center"
      >
        <p className="text-sm text-destructive">
          Failed to load relationships.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Relationships ({relationships.length})
        </p>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add relationship
          </Button>
        )}
      </div>

      {relationships.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <p className="text-sm">No relationships yet.</p>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={openAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add relationship
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.key);
            return (
              <div key={group.key} className="space-y-2">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center gap-1.5 text-sm font-semibold text-foreground"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {group.legend}
                  <span className="text-muted-foreground">
                    ({group.items.length})
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-2">
                    {group.items.map((rel) => {
                      const otherId = otherCharacterId(rel, characterId);
                      const info = nameById.get(otherId);
                      const otherName = info?.name ?? "Unknown character";
                      // Direction narrative reads off the stored row's own
                      // subject (character_id) → object (related_character_id).
                      const subjectName =
                        rel.character_id === characterId
                          ? characterName
                          : otherName;
                      const objectName =
                        rel.character_id === characterId
                          ? otherName
                          : characterName;
                      return (
                        <RelationshipCard
                          key={rel.id}
                          otherCharacter={{
                            name: otherName,
                            slug: info?.slug ?? "",
                            characterType: info?.character_type ?? "",
                            initials: initials(otherName),
                          }}
                          relationshipType={rel.relationship_type}
                          relationshipRole={rel.relationship_role}
                          startTemporal={
                            (rel.start_temporal as TemporalData | null) ?? null
                          }
                          endTemporal={
                            (rel.end_temporal as TemporalData | null) ?? null
                          }
                          description={rel.description}
                          directionLabel={directionLabel(
                            rel,
                            { subjectName, objectName },
                            vocabulary,
                          )}
                          onEdit={canEdit ? () => openEdit(rel) : undefined}
                          onDuplicate={
                            canEdit ? () => openDuplicate(rel) : undefined
                          }
                          onDelete={
                            canEdit ? () => setDeleteTarget(rel) : undefined
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddRelationshipSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        client={client}
        focalCharacterId={characterId}
        focalCharacterName={characterName}
        existingLinks={existingLinks}
        editing={editing}
        initialOther={initialOther}
        onSaved={() => void refetch()}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete relationship?</DialogTitle>
            <DialogDescription>
              This deletes the relationship and its automatically-created
              reverse entry. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteRel.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={deleteRel.isPending}
            >
              {deleteRel.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

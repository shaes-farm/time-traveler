"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Network, Plus } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
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
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/sonner";
import {
  useRelationshipCategories,
  useUpdateRelationshipCategory,
  useUpdateRelationshipType,
} from "@repo/ui/hooks/use-relationship-types";
import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";
import { getBrowserSupabaseClient } from "../../../../../lib/auth/browser-client";
import { EditorGuardProvider } from "../../../../../lib/editor-guard-context";
import { useRegisterUnsavedChanges } from "../../../../../lib/use-register-unsaved-changes";
import { useUnsavedChangesGuard } from "../../../../../lib/use-unsaved-changes-guard";

import { CategoryInspector } from "./category-inspector";
import { RoleInspector } from "./role-inspector";
import { TypeInspector } from "./type-inspector";
import { VocabularyTree } from "./vocabulary-tree";
import {
  findCategory,
  findRole,
  findType,
  nextSortOrder,
  swapSortOrder,
  type SortOrderPatch,
  type VocabularySelection,
} from "./vocabulary-tree-utils";

/**
 * The relationship vocabulary manager: a persistent tree on the left, a
 * create/edit inspector on the right.
 *
 * ## Selection lives in search params, not nested routes
 *
 * `/categories` models its inspector as child routes (`new/`, `[id]/`). Three
 * levels here would mean six route folders for a low-traffic admin surface, so
 * selection is `?level=…&key=…&type=…` instead. Still deep-linkable and still
 * back-button friendly, and the tree stays mounted across selections for free
 * rather than needing a layout to hold it.
 *
 * ## Reads the inactive rows too
 *
 * `activeOnly: false` — this is the one surface where retired vocabulary must
 * stay visible, otherwise deactivating an entry would make it unreachable and
 * un-restorable.
 */
export function VocabularyManagerShell() {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const searchParams = useSearchParams();

  const categoriesQuery = useRelationshipCategories(client, {
    activeOnly: false,
  });
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  // Reordering writes two rows; both go through the normal update mutations so
  // the vocabulary cache invalidation is identical to any other edit.
  const updateCategoryMut = useUpdateRelationshipCategory(client);
  const updateTypeMut = useUpdateRelationshipType(client);
  const reorderPending = updateCategoryMut.isPending || updateTypeMut.isPending;
  // `mutateAsync` is referentially stable; the mutation *result objects* are
  // not. Depending on the objects would rebuild `handleReorder` — and with it
  // every tree node — on each render.
  const updateCategory = updateCategoryMut.mutateAsync;
  const updateType = updateTypeMut.mutateAsync;

  // The inspector reports its form's dirty state up via context; this shell
  // owns the navigations that would lose those edits (switching tree
  // rows/levels, "New"), so it routes them through the shared guard. `replace`
  // because selection lives in this one route's query params — a `push` per
  // row click would pile up a history entry for every selection.
  const [isDirty, setIsDirty] = React.useState(false);
  const setDirty = React.useCallback((dirty: boolean) => setIsDirty(dirty), []);
  const guardValue = React.useMemo(() => ({ setDirty }), [setDirty]);
  const guard = useUnsavedChangesGuard(isDirty, { replace: true });
  useRegisterUnsavedChanges(isDirty);

  const selection = parseSelection(searchParams);

  const select = React.useCallback(
    (next: VocabularySelection | null) => {
      if (!next) {
        guard.requestNavigate("/admin/relationship-vocabulary");
        return;
      }
      const params = new URLSearchParams({ level: next.level });
      if (next.key) params.set("key", next.key);
      if (next.parentKey) params.set("parent", next.parentKey);
      guard.requestNavigate(
        `/admin/relationship-vocabulary?${params.toString()}`,
      );
    },
    [guard],
  );

  const handleReorder = React.useCallback(
    async (
      level: "category" | "type",
      key: string,
      direction: "up" | "down",
    ) => {
      const siblings =
        level === "category"
          ? categories
          : (categories.find((category) =>
              category.types.some((type) => type.key === key),
            )?.types ?? []);

      const patches = swapSortOrder(siblings, key, direction);
      if (!patches) return;

      const originalByKey = new Map(
        siblings.map((sibling) => [sibling.key, sibling.sort_order]),
      );
      const writeOne = (patch: SortOrderPatch) =>
        level === "category"
          ? updateCategory({
              key: patch.key,
              patch: { sort_order: patch.sort_order },
            })
          : updateType({
              key: patch.key,
              patch: { sort_order: patch.sort_order },
            });

      const written: SortOrderPatch[] = [];
      try {
        // Sequential rather than parallel: a move can write more than two rows
        // (a tied block gets renumbered as a unit), and issuing them together
        // risks leaving rows sharing one sort_order with no obvious way back.
        for (const patch of patches) {
          await writeOne(patch);
          written.push(patch);
        }
      } catch (error) {
        // Compensating rollback: restore every row this move already wrote
        // before the failure hit, rather than leaving a partial reorder (and
        // its duplicate sort_order values) in place. Best-effort — if a
        // rollback write itself fails, the original error is still what
        // surfaces below; there is no RPC backing this swap to make it atomic.
        await Promise.allSettled(
          written.map((patch) => {
            const original = originalByKey.get(patch.key);
            return original === undefined
              ? Promise.resolve()
              : writeOne({ key: patch.key, sort_order: original });
          }),
        );
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn’t reorder that entry.",
        );
      }
    },
    [categories, updateCategory, updateType],
  );

  const total = categories.reduce(
    (sum, category) => sum + category.types.length,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="font-display text-xl text-foreground">
            Relationship vocabulary
          </h1>
          {!categoriesQuery.isPending && !categoriesQuery.isError && (
            <p className="text-sm text-foreground-muted">
              {categories.length} group{categories.length === 1 ? "" : "s"} ·{" "}
              {total} type{total === 1 ? "" : "s"} · shared by every editor
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => select({ level: "category" })}>
              Group
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={categories.length === 0}
              onSelect={() =>
                select({
                  level: "type",
                  parentKey: currentCategoryKey(categories, selection),
                })
              }
            >
              Relationship type
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedTypeKey(categories, selection) === undefined}
              onSelect={() =>
                select({
                  level: "role",
                  parentKey: selectedTypeKey(categories, selection),
                })
              }
            >
              Sub-role of the selected type
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-auto">
          {categoriesQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>Couldn’t load the vocabulary</AlertTitle>
                <AlertDescription className="flex items-center gap-3">
                  {categoriesQuery.error instanceof Error
                    ? categoriesQuery.error.message
                    : "Something went wrong."}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void categoriesQuery.refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : categoriesQuery.isPending ? (
            <div className="space-y-2 p-4">
              {["s1", "s2", "s3", "s4", "s5"].map((id) => (
                <Skeleton key={id} className="h-8 w-full rounded-md" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <Network
                className="h-10 w-10 text-foreground-subtle"
                aria-hidden
              />
              <div className="max-w-md space-y-1">
                <p className="font-medium text-foreground">
                  No relationship vocabulary yet
                </p>
                <p className="text-sm text-foreground-muted">
                  Groups organise the relationship type picker every editor
                  sees. Start with a group — Family, Professional — then add the
                  types that belong in it.
                </p>
              </div>
              <Button onClick={() => select({ level: "category" })}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New group
              </Button>
            </div>
          ) : (
            <VocabularyTree
              categories={categories}
              selection={selection}
              onSelect={select}
              onReorder={handleReorder}
              reorderPending={reorderPending}
            />
          )}
        </main>

        <aside className="flex w-96 shrink-0 flex-col overflow-hidden border-l border-border">
          {/*
            Held back until the tree has loaded. The inspectors capture their
            `defaultValues` at mount and are only remounted when the selection
            changes, so mounting one against an empty `categories` — which is
            what a deep link or a refresh does — would leave the form blank and
            never hydrate it once the data arrived.
          */}
          {categoriesQuery.isPending || categoriesQuery.isError ? null : (
            <EditorGuardProvider value={guardValue}>
              <Inspector
                client={client}
                categories={categories}
                selection={selection}
                onSelect={select}
              />
            </EditorGuardProvider>
          )}
        </aside>
      </div>

      {/* Discard-changes confirmation for shell-driven navigation. */}
      <Dialog
        open={guard.isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) guard.cancelNavigation();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes to this entry. Leaving now will lose
              them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={guard.cancelNavigation}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={guard.confirmNavigation}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Picks the inspector for the current selection.
 *
 * Each inspector is remounted via `key` when the selection changes, so form
 * state resets cleanly between rows instead of being hand-rehydrated — the same
 * approach the category manager takes.
 */
function Inspector({
  client,
  categories,
  selection,
  onSelect,
}: {
  client: SupabaseClient;
  categories: RelationshipCategoryMeta[];
  selection: VocabularySelection | null;
  onSelect: (selection: VocabularySelection | null) => void;
}) {
  if (!selection) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-foreground-muted">
          Select an entry to edit it, or use New to add one.
        </p>
      </div>
    );
  }

  if (selection.level === "category") {
    const category = selection.key
      ? findCategory(categories, selection.key)
      : undefined;
    // A key was named but doesn't resolve — a stale or mistyped deep link, not
    // an intentional "create new". Say so rather than silently opening a blank
    // create form (which `category === undefined` would otherwise do).
    if (selection.key && !category) {
      return <NotFound level="group" onBack={() => onSelect(null)} />;
    }
    return (
      <CategoryInspector
        key={`category:${selection.key ?? "new"}`}
        client={client}
        category={category}
        defaultSortOrder={nextSortOrder(categories)}
        onSaved={(key) => onSelect({ level: "category", key })}
        onDeleted={() => onSelect(null)}
        onCancel={() => onSelect(null)}
      />
    );
  }

  if (selection.level === "type") {
    const type = selection.key
      ? findType(categories, selection.key)
      : undefined;
    if (selection.key && !type) {
      return (
        <NotFound level="relationship type" onBack={() => onSelect(null)} />
      );
    }
    const parentCategoryKey =
      type?.category_key ?? selection.parentKey ?? categories[0]?.key ?? "";
    const siblings = findCategory(categories, parentCategoryKey)?.types ?? [];
    return (
      <TypeInspector
        key={`type:${selection.key ?? "new"}`}
        client={client}
        categories={categories}
        type={type}
        defaultCategoryKey={parentCategoryKey}
        defaultSortOrder={nextSortOrder(siblings)}
        onSaved={(key) => onSelect({ level: "type", key })}
        // Land on the parent group rather than clearing the selection. Beyond
        // being a sensible place to end up, it keeps the tree where it was:
        // the Tree reveals a selected node by expanding its ancestors, so
        // deselecting entirely would collapse the branch the user is working in.
        onDeleted={() =>
          parentCategoryKey
            ? onSelect({ level: "category", key: parentCategoryKey })
            : onSelect(null)
        }
        onCancel={() => onSelect(null)}
      />
    );
  }

  const parentTypeKey = selection.parentKey;
  const parentType = parentTypeKey
    ? findType(categories, parentTypeKey)
    : undefined;
  if (!parentTypeKey) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-foreground-muted">
          Select a relationship type first — sub-roles belong to one.
        </p>
      </div>
    );
  }
  if (!parentType) {
    // `parentTypeKey` was named but no longer resolves — the type it belonged
    // to was deleted or renamed out from under this link. Distinct from the
    // "nothing selected yet" case above, which the check order preserves.
    return <NotFound level="relationship type" onBack={() => onSelect(null)} />;
  }
  const role = selection.key
    ? findRole(categories, parentTypeKey, selection.key)
    : undefined;
  if (selection.key && !role) {
    return (
      <NotFound
        level="sub-role"
        onBack={() => onSelect({ level: "type", key: parentTypeKey })}
      />
    );
  }

  return (
    <RoleInspector
      key={`role:${parentTypeKey}:${selection.key ?? "new"}`}
      client={client}
      parentType={parentType}
      role={role}
      defaultSortOrder={nextSortOrder(parentType.roles)}
      onSaved={(key) =>
        onSelect({ level: "role", key, parentKey: parentTypeKey })
      }
      // Land on the parent type — see the note on TypeInspector's onDeleted.
      onDeleted={() => onSelect({ level: "type", key: parentTypeKey })}
      onCancel={() => onSelect(null)}
    />
  );
}

/**
 * A `key` named in the URL that no longer resolves — a stale bookmark, a typo,
 * or a row deleted since the link was copied. Distinct from create mode (no
 * `key` at all), which falls through to the inspector instead.
 */
function NotFound({ level, onBack }: { level: string; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-foreground-muted">
      <p>This {level} no longer exists.</p>
      <Button variant="secondary" size="sm" onClick={onBack}>
        Back to the list
      </Button>
    </div>
  );
}

/** Read the selection out of the URL, ignoring anything malformed. */
function parseSelection(
  params: Pick<URLSearchParams, "get"> | null,
): VocabularySelection | null {
  const level = params?.get("level");
  if (level !== "category" && level !== "type" && level !== "role") {
    return null;
  }
  return {
    level,
    key: params?.get("key") ?? undefined,
    parentKey: params?.get("parent") ?? undefined,
  };
}

/** The category a new type should default into, given the current selection. */
function currentCategoryKey(
  categories: RelationshipCategoryMeta[],
  selection: VocabularySelection | null,
): string | undefined {
  if (selection?.level === "category" && selection.key) return selection.key;
  if (selection?.level === "type" && selection.key) {
    return findType(categories, selection.key)?.category_key;
  }
  return categories[0]?.key;
}

/** The type a new sub-role should hang off, or undefined if none is selected. */
function selectedTypeKey(
  categories: RelationshipCategoryMeta[],
  selection: VocabularySelection | null,
): string | undefined {
  if (selection?.level === "type" && selection.key) return selection.key;
  if (selection?.level === "role") return selection.parentKey;
  return undefined;
}

"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FolderTree, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  useCategoryTree,
  useCategoryUsageCounts,
} from "@repo/ui/hooks/use-categories";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";

import { CategoryTree } from "./category-tree";
import {
  CategoryInspector,
  type InspectorSelection,
} from "./category-inspector";
import { flattenTree, findNode } from "./category-tree-utils";

type Selection =
  | { mode: "edit"; id: string }
  | { mode: "create"; parentId: string | null }
  | null;

export function CategoryManagerClient({ userId }: { userId: string }) {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const searchParams = useSearchParams();

  const treeQuery = useCategoryTree(client, userId);
  const usageQuery = useCategoryUsageCounts(client, userId);

  // Deep-link: /categories?new=1 (topbar quick-create) opens the create form.
  const [selection, setSelection] = React.useState<Selection>(() =>
    searchParams.get("new") !== null
      ? { mode: "create", parentId: null }
      : null,
  );

  const tree = React.useMemo(() => treeQuery.data ?? [], [treeQuery.data]);
  const total = React.useMemo(() => flattenTree(tree).length, [tree]);
  const rootCount = tree.length;

  // Resolve the edit selection against the live tree; a deleted node clears it.
  const inspectorSelection: InspectorSelection | null = React.useMemo(() => {
    if (selection === null) return null;
    if (selection.mode === "create") return selection;
    const node = findNode(tree, selection.id);
    return node ? { mode: "edit", node } : null;
  }, [selection, tree]);

  const selectionKey =
    selection === null
      ? "none"
      : selection.mode === "edit"
        ? `edit:${selection.id}`
        : `create:${selection.parentId ?? "root"}`;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="font-display text-xl text-foreground">Categories</h1>
          {!treeQuery.isPending && !treeQuery.isError && total > 0 && (
            <p className="text-sm text-foreground-muted">
              {total} categor{total === 1 ? "y" : "ies"} · {rootCount} root
              {rootCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Button
          onClick={() => setSelection({ mode: "create", parentId: null })}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          New category
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {treeQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>Couldn’t load categories</AlertTitle>
                <AlertDescription className="flex items-center gap-3">
                  {treeQuery.error instanceof Error
                    ? treeQuery.error.message
                    : "Something went wrong."}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void treeQuery.refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : treeQuery.isPending ? (
            <div className="space-y-2 p-4">
              {["s1", "s2", "s3", "s4", "s5"].map((id) => (
                <Skeleton key={id} className="h-8 w-full rounded-md" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <FolderTree
                className="h-10 w-10 text-foreground-subtle"
                aria-hidden
              />
              <div className="max-w-md space-y-1">
                <p className="font-medium text-foreground">No categories yet</p>
                <p className="text-sm text-foreground-muted">
                  Categories are the tags that organize your events — nest them
                  into a tree (Science → Physics → Quantum Mechanics).
                </p>
              </div>
              <Button
                onClick={() => setSelection({ mode: "create", parentId: null })}
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New category
              </Button>
            </div>
          ) : (
            <CategoryTree
              tree={tree}
              usage={usageQuery.data}
              onSelect={(id) => setSelection({ mode: "edit", id })}
            />
          )}
        </main>

        <aside className="flex w-80 shrink-0 flex-col border-l border-border">
          {inspectorSelection === null ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-foreground-muted">
              Select a category to edit, or create a new one.
            </div>
          ) : (
            <CategoryInspector
              key={selectionKey}
              client={client}
              tree={tree}
              usage={usageQuery.data}
              selection={inspectorSelection}
              onSaved={(node) => setSelection({ mode: "edit", id: node.id })}
              onDeleted={() => setSelection(null)}
              onCancel={() => setSelection(null)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FolderTree, Plus } from "lucide-react";

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
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  useCategoryTree,
  useCategoryUsageCounts,
} from "@repo/ui/hooks/use-categories";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { EditorGuardProvider } from "../../../../lib/editor-guard-context";
import { useRegisterUnsavedChanges } from "../../../../lib/use-register-unsaved-changes";
import { useUnsavedChangesGuard } from "../../../../lib/use-unsaved-changes-guard";

import { CategoryTree } from "./category-tree";
import { flattenTree } from "./category-tree-utils";

/**
 * The persistent left pane of the category manager: the tree, its header, and
 * the "new category" affordance. Lives in the route-group layout, so it stays
 * mounted while the inspector (`children`, driven by the nested route) swaps —
 * preserving tree filter/expand state across create/edit navigation.
 */
export function CategoryManagerShell({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const params = useParams<{ id?: string }>();
  const selectedId = typeof params.id === "string" ? params.id : undefined;

  // The inspector (child route) reports its form's dirty state up via context;
  // the shell owns the navigations that would lose those edits (switching tree
  // nodes, "New category"), so it routes them through the shared guard.
  const [isDirty, setIsDirty] = React.useState(false);
  const setDirty = React.useCallback((dirty: boolean) => setIsDirty(dirty), []);
  const guardValue = React.useMemo(() => ({ setDirty }), [setDirty]);
  const guard = useUnsavedChangesGuard(isDirty);
  useRegisterUnsavedChanges(isDirty);

  const treeQuery = useCategoryTree(client, userId);
  const usageQuery = useCategoryUsageCounts(client, userId);

  const tree = React.useMemo(() => treeQuery.data ?? [], [treeQuery.data]);
  const total = React.useMemo(() => flattenTree(tree).length, [tree]);
  const rootCount = tree.length;

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
        <Button onClick={() => guard.requestNavigate("/categories/new")}>
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
              <Button onClick={() => guard.requestNavigate("/categories/new")}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New category
              </Button>
            </div>
          ) : (
            <CategoryTree
              tree={tree}
              usage={usageQuery.data}
              selectedId={selectedId}
              onSelect={(id) => guard.requestNavigate(`/categories/${id}`)}
            />
          )}
        </main>

        <aside className="flex w-80 shrink-0 flex-col border-l border-border">
          <EditorGuardProvider value={guardValue}>
            {children}
          </EditorGuardProvider>
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
              You have unsaved changes to this category. Leaving now will lose
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

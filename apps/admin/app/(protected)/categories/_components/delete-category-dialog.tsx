"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import {
  useDeleteCategory,
  useDeleteCategoryReparentingChildren,
} from "@repo/ui/hooks/use-categories";
import type { CategoryNode } from "@repo/services/category-service";

import {
  findNode,
  countDescendants,
  sumSubtreeUsage,
} from "./category-tree-utils";

function pluralize(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Delete-a-category confirmation with an explicit child + usage policy
 * (wireframe 24 #6). Shows the blast radius, then:
 * - a node with children offers **Reparent children first** (recommended —
 *   preserves the subtree, deletes only this node) vs **Delete subtree** (raw
 *   cascade);
 * - a leaf offers a single Delete.
 */
export function DeleteCategoryDialog({
  client,
  node,
  tree,
  usage,
  open,
  onOpenChange,
  onDeleted,
}: {
  client: SupabaseClient;
  node: CategoryNode;
  tree: CategoryNode[];
  usage: Record<string, number> | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const cascade = useDeleteCategory(client);
  const reparent = useDeleteCategoryReparentingChildren(client);
  const pending = cascade.isPending || reparent.isPending;

  const counts = usage ?? {};
  const descendants = countDescendants(node);
  const hasChildren = descendants > 0;
  const ownUsage = counts[node.id] ?? 0;
  const subtreeUsage = sumSubtreeUsage(node, counts);

  const parentName =
    node.parent_category_id === null
      ? "root"
      : (findNode(tree, node.parent_category_id)?.title ?? "root");

  const childPreview = (node.children ?? [])
    .slice(0, 3)
    .map((c) => c.title)
    .join(", ");

  async function run(
    kind: "cascade" | "reparent",
    mutate: (id: string) => Promise<void>,
  ) {
    try {
      await mutate(node.id);
      toast.success(
        kind === "reparent"
          ? `Deleted “${node.title}”; its children were reparented.`
          : `Deleted “${node.title}”.`,
      );
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete category.",
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{node.title}”?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {hasChildren ? (
                <>
                  <p>
                    This category has {pluralize(descendants, "descendant")}
                    {childPreview && ` (${childPreview}…)`}. Choose how to
                    handle them:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      <strong>Reparent children first</strong> — move its direct
                      children up to <em>{parentName}</em>, then delete only
                      this category (removes its tag from{" "}
                      {pluralize(ownUsage, "event")}
                      ). The subtree is preserved.
                    </li>
                    <li>
                      <strong>Delete subtree</strong> — delete this category and
                      all {pluralize(descendants, "descendant")}, removing tags
                      from {pluralize(subtreeUsage, "event")}.
                    </li>
                  </ul>
                </>
              ) : (
                <p>
                  This removes its tag from {pluralize(ownUsage, "event")}. This
                  cannot be undone.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {hasChildren ? (
            <>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => void run("cascade", cascade.mutateAsync)}
              >
                Delete subtree
              </Button>
              <Button
                variant="primary"
                disabled={pending}
                onClick={() => void run("reparent", reparent.mutateAsync)}
              >
                Reparent children first
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => void run("cascade", cascade.mutateAsync)}
            >
              Delete
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

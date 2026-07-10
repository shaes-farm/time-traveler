"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Skeleton } from "@repo/ui/components/skeleton";
import {
  useCategoryTree,
  useCategoryUsageCounts,
} from "@repo/ui/hooks/use-categories";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";

import { CategoryInspector } from "./category-inspector";
import { findNode } from "./category-tree-utils";

/**
 * Edit-form wrapper for the `/categories/[id]` route. Resolves the node from
 * the cached tree; shows a skeleton while it loads and a not-found notice if
 * the id doesn't resolve (deleted node / bad link) — the tree stays available
 * in the shell to pick another.
 */
export function EditCategoryClient({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const router = useRouter();

  const treeQuery = useCategoryTree(client, userId);
  const usageQuery = useCategoryUsageCounts(client, userId);
  const tree = treeQuery.data ?? [];
  const node = findNode(tree, id);

  if (treeQuery.isPending) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-foreground-muted">
        <p>That category no longer exists.</p>
        <Link href="/categories" className="text-primary hover:underline">
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <CategoryInspector
      key={id}
      client={client}
      tree={tree}
      usage={usageQuery.data}
      selection={{ mode: "edit", node }}
      onSaved={() => {
        // The update mutation invalidates the tree/usage queries, so the shell
        // refreshes itself; nothing to navigate.
      }}
      onDeleted={() => router.push("/categories")}
      onCancel={() => router.push("/categories")}
    />
  );
}

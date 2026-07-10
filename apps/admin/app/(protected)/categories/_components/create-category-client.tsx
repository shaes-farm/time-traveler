"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  useCategoryTree,
  useCategoryUsageCounts,
} from "@repo/ui/hooks/use-categories";
import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";

import { CategoryInspector } from "./category-inspector";

/**
 * Create-form wrapper for the `/categories/new` route. Reads the tree/usage
 * from cache (same query keys the shell populates — no extra fetch) to feed the
 * inspector's parent picker, and routes to the new node on save.
 */
export function CreateCategoryClient({
  userId,
  parentId,
}: {
  userId: string;
  parentId: string | null;
}) {
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);
  const router = useRouter();

  const treeQuery = useCategoryTree(client, userId);
  const usageQuery = useCategoryUsageCounts(client, userId);
  const tree = treeQuery.data ?? [];

  return (
    <CategoryInspector
      client={client}
      tree={tree}
      usage={usageQuery.data}
      selection={{ mode: "create", parentId }}
      onSaved={(node) => router.push(`/categories/${node.id}`)}
      onDeleted={() => router.push("/categories")}
      onCancel={() => router.push("/categories")}
    />
  );
}

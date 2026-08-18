"use client";

import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";

/**
 * Permanent deletion, gated on usage.
 *
 * Both vocabulary FKs are `ON DELETE RESTRICT`, so deleting an in-use type or a
 * non-empty category fails with a bare `23503`. Rather than let the user
 * discover that by hitting it, the dialog fetches the blast radius on open and
 * disables the action with the reason — and points at deactivation, which is
 * what they almost always want.
 *
 * The count is deliberately *not* trusted as a permission check: a relationship
 * can be created between the count landing and the confirm click, so the
 * service still maps the resulting `23503` to the same sentence. This is the
 * fast path, not the guarantee.
 */
export function DeleteVocabularyDialog({
  open,
  onOpenChange,
  onConfirm,
  onDeactivateInstead,
  pending,
  entryLabel,
  level,
  /** Rows that block deletion. `undefined` while the count is still loading. */
  blockingCount,
  /** What the blocking rows are, for the explanatory sentence. */
  blockingNoun,
  /**
   * True only while the count query has neither cached nor fresh data — as
   * opposed to `blockingCount === undefined`, which also reads true while a
   * *stale cached* count is being silently refreshed in the background. Using
   * that alone would let a stale "0" enable deletion for a moment before the
   * refetch lands.
   */
  isLoading,
  /** The count request itself failed — distinct from "still loading" so this
   * doesn't spin forever with no way out. */
  isError,
  onRetry,
  /** Other rows that name this one as their inverse — informational, not
   * blocking: deletion is still safe, but it silently un-pairs them. */
  inverseReferenceCount,
  inverseReferenceNoun,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onDeactivateInstead: () => void;
  pending: boolean;
  entryLabel: string;
  level: "category" | "type" | "role";
  blockingCount: number | undefined;
  blockingNoun: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  inverseReferenceCount?: number;
  inverseReferenceNoun?: string;
}) {
  const noun =
    level === "category" ? "group" : level === "type" ? "type" : "sub-role";
  const isBlocked = !isLoading && !isError && (blockingCount ?? 0) > 0;
  const isSafe = !isLoading && !isError && blockingCount === 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete “{entryLabel}” permanently?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {isLoading && (
                <p className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Checking what uses this {noun}…
                </p>
              )}
              {isError && !isLoading && (
                <p className="flex items-center gap-3 text-destructive">
                  Couldn’t check what uses this {noun}.
                  <Button variant="secondary" size="sm" onClick={onRetry}>
                    Retry
                  </Button>
                </p>
              )}
              {isBlocked && (
                <p className="font-medium text-foreground">
                  {blockingCount} {blockingNoun}
                  {blockingCount === 1 ? " uses" : "s use"} this {noun}, so it
                  can’t be deleted. Deactivate it instead — existing data keeps
                  working and it stops being offered for new entries.
                </p>
              )}
              {isSafe && (
                <p>
                  Nothing uses this {noun}, so deleting it is safe. This cannot
                  be undone.
                </p>
              )}
              {isSafe &&
                inverseReferenceCount !== undefined &&
                inverseReferenceCount > 0 && (
                  <p className="font-medium text-foreground">
                    {inverseReferenceCount} other {inverseReferenceNoun}
                    {inverseReferenceCount === 1 ? "" : "s"} name this as{" "}
                    {inverseReferenceCount === 1 ? "its" : "their"} inverse.
                    Deleting will silently clear that pairing.
                  </p>
                )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {isBlocked ? (
            <AlertDialogAction disabled={pending} onClick={onDeactivateInstead}>
              Deactivate instead
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              disabled={pending || !isSafe}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              Delete permanently
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

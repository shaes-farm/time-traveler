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
}) {
  const noun =
    level === "category" ? "group" : level === "type" ? "type" : "sub-role";
  const isLoading = blockingCount === undefined;
  const isBlocked = blockingCount !== undefined && blockingCount > 0;

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
              {isBlocked && (
                <p className="font-medium text-foreground">
                  {blockingCount} {blockingNoun}
                  {blockingCount === 1 ? " uses" : "s use"} this {noun}, so it
                  can’t be deleted. Deactivate it instead — existing data keeps
                  working and it stops being offered for new entries.
                </p>
              )}
              {blockingCount === 0 && (
                <p>
                  Nothing uses this {noun}, so deleting it is safe. This cannot
                  be undone.
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
              disabled={pending || isLoading}
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

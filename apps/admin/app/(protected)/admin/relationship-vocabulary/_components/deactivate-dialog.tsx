"use client";

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
 * Confirmation for retiring (or restoring) a vocabulary entry.
 *
 * Deactivation is the *recommended* destructive action here — it retires a verb
 * without touching a single historical relationship row (ADR-0040 POS-004) —
 * but it is not consequence-free, and the consequence is invisible from this
 * screen: everything under a deactivated entry vanishes from the relationship
 * type picker for every editor. So the blast radius is stated before the
 * confirm, not after.
 */
export function DeactivateDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
  entryLabel,
  level,
  /** Types in this category (categories only) — the group that will disappear. */
  affectedTypeCount,
  /** Relationships currently using this type; undefined while loading. */
  usageCount,
  /** Restoring rather than retiring — no warning needed. */
  reactivating = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
  entryLabel: string;
  level: "category" | "type" | "role";
  affectedTypeCount?: number;
  usageCount?: number;
  reactivating?: boolean;
}) {
  const noun =
    level === "category" ? "group" : level === "type" ? "type" : "sub-role";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {reactivating
              ? `Reactivate “${entryLabel}”?`
              : `Deactivate “${entryLabel}”?`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {reactivating ? (
                <p>
                  This {noun} will be offered again when editors create
                  relationships.
                </p>
              ) : (
                <>
                  <p>
                    Existing relationships keep working and nothing is deleted.
                    This {noun} simply stops being offered for new ones.
                  </p>
                  {level === "category" && affectedTypeCount !== undefined && (
                    <p className="font-medium text-foreground">
                      {affectedTypeCount === 0
                        ? "This group is empty, so no types are affected."
                        : `All ${affectedTypeCount} type${
                            affectedTypeCount === 1 ? "" : "s"
                          } in this group will disappear from the relationship type picker.`}
                    </p>
                  )}
                  {level === "type" && usageCount !== undefined && (
                    <p className="font-medium text-foreground">
                      {usageCount === 0
                        ? "No relationships currently use this type."
                        : `${usageCount} existing relationship${
                            usageCount === 1 ? "" : "s"
                          } use this type and will keep displaying normally.`}
                    </p>
                  )}
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              // Keep the dialog mounted while the mutation runs so the pending
              // state is visible; the caller closes it on success.
              event.preventDefault();
              onConfirm();
            }}
          >
            {reactivating ? "Reactivate" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

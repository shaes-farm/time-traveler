"use client";

import * as React from "react";
import { useUiStore } from "@repo/ui/stores";

/**
 * Registers an editor's dirty state with the global unsaved-changes registry so
 * the app shell can guard navigation away from it. Complements the per-editor
 * `useUnsavedChangesGuard`, which covers caller-controlled in-app navigation
 * (Cancel/breadcrumbs, category tree-node / "New category"); this hook covers
 * the app-shell surfaces those can't see — sidebar, quick-create, breadcrumbs —
 * via `ShellLink`'s `onNavigate` interception plus one app-level discard dialog
 * in `ProtectedShell`.
 *
 * Also owns the `beforeunload` backstop (reload / tab close / external link), so
 * hard-navigation coverage lives in one place. Every editor that opts into the
 * shell guard gets it for free.
 *
 * The registry is keyed by a stable `useId`, so overlapping mounts / route
 * transitions ref-count correctly rather than one editor clobbering another's flag.
 */
export function useRegisterUnsavedChanges(isDirty: boolean): void {
  const id = React.useId();
  const setEditorDirty = useUiStore((s) => s.setEditorDirty);

  React.useEffect(() => {
    setEditorDirty(id, isDirty);
    // Clear on unmount so navigating away from the editor disarms the guard.
    return () => setEditorDirty(id, false);
  }, [id, isDirty, setEditorDirty]);

  React.useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required for Chrome to show the native prompt.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}

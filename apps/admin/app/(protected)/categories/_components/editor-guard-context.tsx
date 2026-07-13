"use client";

import * as React from "react";

/**
 * Bridges the category inspector's dirty state up to the manager shell's
 * unsaved-changes guard. The inspector lives in the `[id]`/`new` child route
 * while the navigations that would lose edits — switching tree nodes, "New
 * category" — live in the shell (the parent layout), so the shell can't read
 * the form's state directly. The shell provides `setDirty`; the inspector
 * reports through `useReportEditorDirty`.
 */
interface EditorGuardValue {
  setDirty: (dirty: boolean) => void;
}

const EditorGuardContext = React.createContext<EditorGuardValue | null>(null);

export function EditorGuardProvider({
  value,
  children,
}: {
  value: EditorGuardValue;
  children: React.ReactNode;
}) {
  return <EditorGuardContext value={value}>{children}</EditorGuardContext>;
}

/** Report the current editor's dirty state to the shell guard (no-op outside a provider). */
export function useReportEditorDirty(isDirty: boolean): void {
  const ctx = React.use(EditorGuardContext);
  const setDirty = ctx?.setDirty;
  React.useEffect(() => {
    if (!setDirty) return;
    setDirty(isDirty);
    // Clear on unmount so navigating away from the inspector disarms the guard.
    return () => setDirty(false);
  }, [isDirty, setDirty]);
}

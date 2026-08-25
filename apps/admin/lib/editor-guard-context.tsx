"use client";

import * as React from "react";

/**
 * Bridges an inspector's dirty state up to its shell's unsaved-changes guard.
 * The inspector lives nested (a child route, or a query-param-selected panel)
 * while the navigations that would lose its edits — switching tree nodes/rows,
 * "New" — live in the shell, so the shell can't read the form's state directly.
 * The shell provides `setDirty`; the inspector reports through
 * `useReportEditorDirty`.
 *
 * Shared by the category manager and the relationship-vocabulary manager —
 * generic on purpose, despite the name predating the second consumer.
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

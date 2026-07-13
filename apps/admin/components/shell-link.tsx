"use client";

import Link from "next/link";
import type { ShellLinkProps } from "@repo/ui/components/shell";
import { useUiStore } from "@repo/ui/stores";

/**
 * Next-specific adapter for the Shell's framework-agnostic
 * `LinkComponent` slot. Confines `next/link` to the app layer per
 * Batch C's design-for-extraction note in
 * docs/design/admin/fidelity-2-plan.md.
 *
 * Also the single client-side interception point for the global unsaved-changes
 * guard: because all three shell nav surfaces (sidebar, quick-create,
 * breadcrumbs) render through this component, cancelling the client-side
 * navigation here via `onNavigate` covers all of them at once. When any editor
 * is dirty we defer the navigation to the app-level discard dialog in
 * `ProtectedShell` instead of letting it proceed.
 */
export const ShellLink = ({
  href,
  className,
  children,
  ...rest
}: ShellLinkProps) => {
  const hasUnsavedChanges = useUiStore((s) => s.dirtyEditors.size > 0);
  const requestShellNavigate = useUiStore((s) => s.requestShellNavigate);

  return (
    <Link
      href={href}
      className={className}
      onNavigate={(event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          requestShellNavigate(href);
        }
      }}
      {...rest}
    >
      {children}
    </Link>
  );
};

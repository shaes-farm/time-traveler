"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Guards a dirty form against loss from **caller-controlled** in-app navigation:
 * Cancel/breadcrumb buttons and — in the category manager — switching tree nodes
 * and "New category". Call `requestNavigate(href)` instead of `router.push`; when
 * dirty it defers the push and exposes `isConfirmOpen` so the caller can render a
 * confirm dialog, completing the navigation on confirm. Shared by every editor
 * (timeline, event, period, story, character, and the category manager shell).
 *
 * The other two surfaces are covered elsewhere by `useRegisterUnsavedChanges`
 * (`lib/use-register-unsaved-changes.ts`), which every editor also calls:
 *  - **App-shell navigation** (sidebar, quick-create, breadcrumbs) — intercepted
 *    globally via `ShellLink`'s `onNavigate` + one app-level discard dialog.
 *  - **Hard navigation** (reload / tab close / external link) — the `beforeunload`
 *    backstop now lives in that hook so hard-nav coverage is in one place.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const requestNavigate = React.useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingHref(href);
      } else {
        router.push(href);
      }
    },
    [isDirty, router],
  );

  const confirmNavigation = React.useCallback(() => {
    // Push in the event handler, not inside the state updater — an updater runs
    // during render, and navigating there triggers a Router update mid-render.
    if (pendingHref !== null) router.push(pendingHref);
    setPendingHref(null);
  }, [pendingHref, router]);

  const cancelNavigation = React.useCallback(() => setPendingHref(null), []);

  return {
    requestNavigate,
    isConfirmOpen: pendingHref !== null,
    confirmNavigation,
    cancelNavigation,
  };
}

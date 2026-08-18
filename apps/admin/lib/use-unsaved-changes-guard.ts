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
export function useUnsavedChangesGuard(
  isDirty: boolean,
  options?: {
    /**
     * Navigate via `router.replace` instead of `router.push`. The
     * relationship-vocabulary shell selects rows through one route's query
     * params rather than distinct nested routes, so a `push` per row click
     * would pile up a history entry for every selection — `replace` keeps
     * "back" meaning "leave this screen" rather than "undo my last click".
     */
    replace?: boolean;
  },
) {
  const router = useRouter();
  const replace = options?.replace ?? false;
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const navigate = React.useCallback(
    (href: string) => (replace ? router.replace(href) : router.push(href)),
    [replace, router],
  );

  const requestNavigate = React.useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingHref(href);
      } else {
        navigate(href);
      }
    },
    [isDirty, navigate],
  );

  const confirmNavigation = React.useCallback(() => {
    // Navigate in the event handler, not inside the state updater — an
    // updater runs during render, and navigating there triggers a Router
    // update mid-render.
    if (pendingHref !== null) navigate(pendingHref);
    setPendingHref(null);
  }, [pendingHref, navigate]);

  const cancelNavigation = React.useCallback(() => setPendingHref(null), []);

  return {
    requestNavigate,
    isConfirmOpen: pendingHref !== null,
    confirmNavigation,
    cancelNavigation,
  };
}

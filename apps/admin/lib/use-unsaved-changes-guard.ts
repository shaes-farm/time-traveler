"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Guards a dirty form against accidental navigation loss. Shared by every
 * editor (timeline, event, period, story, character, and the category
 * manager shell).
 *
 * Two surfaces are covered:
 *  - **Hard navigation** (reload / tab close / external link): a `beforeunload`
 *    listener triggers the browser's native confirmation while `isDirty`.
 *  - **In-app navigation** the caller controls (Cancel/breadcrumbs, or — in the
 *    category manager — switching tree nodes and "New category"): call
 *    `requestNavigate(href)` instead of `router.push`. When dirty it defers the
 *    push and exposes `isConfirmOpen` so the caller can render a confirm dialog;
 *    on confirm it completes the navigation.
 *
 * NOTE: the App Router has no stable API to intercept arbitrary in-app
 * navigation (e.g. clicking a sidebar link), so only the surfaces routed
 * through `requestNavigate` are guarded in-app; `beforeunload` is the backstop
 * for everything else.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

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

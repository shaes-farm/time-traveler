"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Guards a dirty form against accidental navigation loss.
 *
 * Two surfaces are covered:
 *  - **Hard navigation** (reload / tab close / external link): a `beforeunload`
 *    listener triggers the browser's native confirmation while `isDirty`.
 *  - **In-app navigation** the form controls (Cancel button, breadcrumbs):
 *    call `requestNavigate(href)` instead of `router.push`. When dirty it
 *    defers the push and exposes `isConfirmOpen` so the caller can render a
 *    confirm dialog; on confirm it completes the navigation.
 *
 * (Route-local copy of the character/timeline editor guard — kept per-route
 * rather than promoted to a shared hook to avoid a cross-route import.)
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
    setPendingHref((href) => {
      if (href !== null) router.push(href);
      return null;
    });
  }, [router]);

  const cancelNavigation = React.useCallback(() => setPendingHref(null), []);

  return {
    requestNavigate,
    isConfirmOpen: pendingHref !== null,
    confirmNavigation,
    cancelNavigation,
  };
}

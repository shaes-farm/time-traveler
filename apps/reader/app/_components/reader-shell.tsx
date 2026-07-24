"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { ReaderNav } from "@repo/ui/components/reader-nav";
import { ReaderFooter } from "@repo/ui/components/reader-footer";
import { SkipLink } from "@repo/ui/components/skip-link";
import { StaleContentBanner } from "@repo/ui/components/stale-content-banner";
import { ReaderLink } from "../../components/reader-link";
import {
  READER_NAV_ITEMS,
  FOOTER_LINKS,
  SIGN_IN_HREF,
  TAGLINE,
} from "../../lib/nav";

/**
 * ReaderShell — the persistent public-reader chrome that wraps every route.
 *
 * A thin client wrapper around the framework-agnostic `@repo/ui` reader-*
 * composites: it resolves `usePathname()` for active-route state and moves
 * focus to the destination heading on navigation (accessibility-spec §2.2).
 * It deliberately does NOT import the admin `Shell` ([ADR-0030]/[ADR-0031]).
 *
 * The stale-content banner is mounted here (hidden) as the shared primitive;
 * wiring it to a live subscription is each data screen's own ticket (#258 is
 * the primitive + provider only).
 */
export function ReaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRenderRef = useRef(true);

  // Move focus to the destination screen's <h1> (or the main landmark) on
  // navigation, so keyboard/SR users land on the new content. Skipped on the
  // initial load so we never steal focus from a fresh page. Focus restoration
  // is independent of motion — it happens at the static end state.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const main = mainRef.current;
    if (!main) return;
    const heading = main.querySelector<HTMLElement>("h1");
    const target = heading ?? main;
    // A heading is not focusable by default — guarantee it can receive focus
    // without joining the Tab order.
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus();
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <ReaderNav
        items={READER_NAV_ITEMS}
        currentPath={pathname}
        signInHref={SIGN_IN_HREF}
        LinkComponent={ReaderLink}
      />
      {/* Shared connection-loss primitive — hidden until a screen drives it. */}
      <StaleContentBanner state="hidden" />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 outline-none sm:px-6"
      >
        {children}
      </main>
      <ReaderFooter
        links={FOOTER_LINKS}
        tagline={TAGLINE}
        LinkComponent={ReaderLink}
      />
    </div>
  );
}

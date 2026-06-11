import { Hourglass } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  DefaultReaderLink,
  type ReaderLinkComponent,
} from "@repo/ui/components/reader-link";
import {
  ReaderLiveDot,
  type ReaderLiveState,
} from "@repo/ui/components/reader-live-dot";

/**
 * ReaderNav — the persistent public-reader top bar (`banner` + `navigation`).
 *
 * Composition is fixed by docs/design/public/04-wireframes/00-app-shell.md and
 * the token application in 06-mid-fidelity/00-app-shell.md. It is a SEPARATE
 * composition from the admin Shell (no sidebar, breadcrumb rail, or authoring
 * affordances) and must never import it ([ADR-0030]/[ADR-0031]).
 *
 * Three nav destinations only — Explore / Stories / Search (Search is stubbed
 * at launch). Entity types (periods/characters/events) are reached via
 * contextual cross-links, never the global nav (00-app-shell annotation 2).
 *
 * The single "Sign in" affordance is a low-emphasis, right-aligned deep-link
 * OUT to the admin/auth surface; it gates nothing (annotation 3). It renders as
 * a plain anchor because it leaves the reader app entirely.
 *
 * Presentational + server-renderable: active state comes from the `currentPath`
 * prop, so the shell can resolve `usePathname()` in a thin client wrapper.
 *
 * NOTE (#171): the <640px hamburger panel + focus-trap is owned by #171. This
 * component keeps the nav inline-and-condensed on small screens; the trap is
 * deliberately not built here.
 */
export interface ReaderNavItem {
  label: string;
  href: string;
}

export interface ReaderNavProps {
  items: ReaderNavItem[];
  currentPath: string;
  /** Deep-link OUT to the admin/auth surface. Gates nothing. */
  signInHref: string;
  /** Realtime indicator state; `hidden` (default) until a screen drives it. */
  liveState?: ReaderLiveState;
  /** Framework link adapter (e.g. `next/link`). Falls back to a plain `<a>`. */
  LinkComponent?: ReaderLinkComponent;
}

const isActive = (currentPath: string, href: string): boolean =>
  currentPath === href || (href !== "/" && currentPath.startsWith(`${href}/`));

export const ReaderNav = ({
  items,
  currentPath,
  signInHref,
  liveState = "hidden",
  LinkComponent = DefaultReaderLink,
}: ReaderNavProps) => {
  const brandActive = currentPath === "/";
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 border-b border-border-muted bg-background"
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        {/* Brand / home + ambient-presence live dot */}
        <div className="flex items-center gap-2">
          <LinkComponent
            href="/"
            aria-label="Time Traveler — home"
            aria-current={brandActive ? "page" : undefined}
            className="flex items-center gap-2 font-display text-lg leading-none text-foreground transition-colors hover:text-foreground"
          >
            <Hourglass className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Time Traveler</span>
          </LinkComponent>
          <ReaderLiveDot state={liveState} />
        </div>

        {/* Primary destinations */}
        <nav aria-label="Primary" className="flex flex-1 items-center">
          <ul className="flex items-center gap-4 sm:gap-6">
            {items.map((item) => {
              const active = isActive(currentPath, item.href);
              return (
                <li key={item.href}>
                  <LinkComponent
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "border-b-2 pb-0.5 text-sm transition-colors",
                      active
                        ? "border-foreground text-foreground"
                        : "border-transparent text-foreground-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Single, quiet sign-in deep-link OUT to admin/auth. */}
        <a
          href={signInHref}
          className="shrink-0 text-xs text-foreground-muted transition-colors hover:text-foreground"
        >
          Sign in
        </a>
      </div>
    </header>
  );
};

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
 * ReaderFooter — the minimal reader `contentinfo` footer: a brand line plus
 * About / Sign in / Legal links. No sitemap, no entity directories — that
 * would re-introduce admin-style navigation density (00-app-shell annotation 7).
 *
 * The "Sign in" link deep-links OUT to admin/auth (plain anchor); About/Legal
 * are in-app routes resolved through `LinkComponent`.
 *
 * The brand line intentionally borrows the hi-fi mockup's eyebrow/kicker
 * typographic device (uppercase JetBrains Mono, wide tracking — see the hero
 * kicker and "who's for" persona labels) rather than the mockup's own footer
 * markup, which still uses serif + a clock icon. Optional live dot is static
 * — never a pulse (motion-spec §2.5); amber primary per ADR-0038.
 */
export interface ReaderFooterLink {
  label: string;
  href: string;
  /** When true, render as a plain anchor (deep-link out of the reader app). */
  external?: boolean;
}

export interface ReaderFooterProps {
  links: ReaderFooterLink[];
  /** Brand tagline shown beside the wordmark. */
  tagline?: string;
  /** Realtime indicator state; `hidden` (default) until a screen drives it. */
  liveState?: ReaderLiveState;
  LinkComponent?: ReaderLinkComponent;
  className?: string;
}

export const ReaderFooter = ({
  links,
  tagline = "An immersive temporal reader",
  liveState = "hidden",
  LinkComponent = DefaultReaderLink,
  className,
}: ReaderFooterProps) => (
  <footer
    role="contentinfo"
    className={cn("border-t border-border-muted bg-background", className)}
  >
    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-foreground-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-11 lg:py-10">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground">
        Time Traveler{" "}
        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-muted">
          · {tagline}
        </span>
        <ReaderLiveDot state={liveState} />
      </p>
      <ul className="flex flex-wrap items-center gap-4 lg:gap-6">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                className="text-foreground-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <LinkComponent
                href={link.href}
                className="text-foreground-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </LinkComponent>
            )}
          </li>
        ))}
      </ul>
    </div>
  </footer>
);

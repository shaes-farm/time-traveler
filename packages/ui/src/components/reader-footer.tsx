import { cn } from "@repo/ui/lib/utils";
import {
  DefaultReaderLink,
  type ReaderLinkComponent,
} from "@repo/ui/components/reader-link";

/**
 * ReaderFooter — the minimal reader `contentinfo` footer: a brand line plus
 * About / Sign in / Legal links. No sitemap, no entity directories — that
 * would re-introduce admin-style navigation density (00-app-shell annotation 7).
 *
 * The "Sign in" link deep-links OUT to admin/auth (plain anchor); About/Legal
 * are in-app routes resolved through `LinkComponent`.
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
  LinkComponent?: ReaderLinkComponent;
  className?: string;
}

export const ReaderFooter = ({
  links,
  tagline = "An immersive temporal reader",
  LinkComponent = DefaultReaderLink,
  className,
}: ReaderFooterProps) => (
  <footer
    role="contentinfo"
    className={cn("border-t border-border-muted bg-background", className)}
  >
    <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-sm text-foreground-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="font-display text-foreground">
        Time Traveler{" "}
        <span className="font-body text-xs text-foreground-muted">
          · {tagline}
        </span>
      </p>
      <ul className="flex flex-wrap items-center gap-4">
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

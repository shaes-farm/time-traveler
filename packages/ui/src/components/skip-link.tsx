import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

/**
 * SkipLink — the keyboard-first "Skip to content" affordance that MUST be the
 * first focusable element in the reader shell (accessibility-spec §2.3;
 * 00-app-shell annotation 5). Visually hidden until focused, then revealed
 * pinned to the top-left; activating it jumps focus to the `main` landmark.
 *
 * Render this as the very first child of the document body, before the nav.
 */
export interface SkipLinkProps {
  /** Fragment target of the `main` landmark. Defaults to `#main-content`. */
  targetId?: string;
  children?: ReactNode;
  className?: string;
}

export const SkipLink = ({
  targetId = "main-content",
  children = "Skip to content",
  className,
}: SkipLinkProps) => (
  <a
    href={`#${targetId}`}
    className={cn(
      // Off-screen until focused; revealed on focus as a visible chip.
      "sr-only rounded-md bg-surface px-4 py-2 text-sm font-medium text-foreground outline-none ring-ring",
      "focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:ring-2",
      className,
    )}
  >
    {children}
  </a>
);

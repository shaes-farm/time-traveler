import * as React from "react";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";

/**
 * ReaderContentRail — a labelled, horizontally-scrollable strip of preview
 * cards with the four discovery states baked in (screen-inventory §3).
 *
 * One component owns loading / error / empty / ready so each rail on the
 * landing page (and later Explore/Stories) renders a consistent state machine
 * and the data island stays declarative — it computes a `state` and hands over
 * children. Presentational and framework-agnostic: the island passes already
 * built card elements as `children`.
 *
 * Accessibility: a `section` labelled by its heading; the scroll region is
 * keyboard-focusable so it can be panned without a pointer; the error state
 * exposes a real `button` for retry. Motion is limited to the skeleton pulse,
 * which collapses under `prefers-reduced-motion` at the token layer.
 */
export type ReaderContentRailState = "loading" | "error" | "empty" | "ready";

export interface ReaderContentRailProps {
  /** Rail heading (e.g. "Recent timelines"). */
  title: string;
  state: ReaderContentRailState;
  /** Card elements, rendered when `state === "ready"`. */
  children?: React.ReactNode;
  /** Retry handler for the error state. */
  onRetry?: () => void;
  /** Number of skeleton placeholders to show while loading. */
  skeletonCount?: number;
  emptyMessage?: string;
  errorMessage?: string;
  retryLabel?: string;
  className?: string;
}

export const ReaderContentRail = ({
  title,
  state,
  children,
  onRetry,
  skeletonCount = 4,
  emptyMessage = "Nothing here yet.",
  errorMessage = "Couldn’t load this content.",
  retryLabel = "Retry",
  className,
}: ReaderContentRailProps) => {
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className={cn("space-y-3", className)}>
      <h2
        id={headingId}
        className="font-display text-xl text-foreground sm:text-2xl"
      >
        {title}
      </h2>

      {state === "loading" ? (
        <div aria-hidden="true" className="flex gap-4 overflow-x-hidden pb-2">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <Skeleton key={i} className="h-40 w-72 shrink-0" />
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border-muted bg-surface p-4">
          <p className="font-body text-sm text-foreground-muted">
            {errorMessage}
          </p>
          {onRetry ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {state === "empty" ? (
        <p className="rounded-lg border border-border-muted bg-surface p-4 font-body text-sm text-foreground-muted">
          {emptyMessage}
        </p>
      ) : null}

      {state === "ready" ? (
        <div
          // Focusable so the strip can be panned by keyboard; the cards inside
          // are the real tab stops.
          tabIndex={0}
          className="flex gap-4 overflow-x-auto pb-2 outline-none"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
};

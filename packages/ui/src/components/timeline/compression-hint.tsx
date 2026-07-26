"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import type { ViewMode } from "@repo/ui/stores";
import { isSpanCompressed } from "./scale-mode";

/**
 * CompressionHint — the non-blocking "linear self-trap" recovery hint (#67, V-07).
 *
 * When linear mode is applied to a long span (≥
 * `LINEAR_COMPRESSION_THRESHOLD_YEARS`, see {@link isSpanCompressed}), events
 * pile up illegibly and "user intent respected / no auto-switch" (spec §5.3)
 * leaves silently toggling back as the only escape. This hint makes that
 * recovery explicit without blocking anything: it suggests logarithmic and
 * offers a one-click switch, and it is dismissible.
 *
 * It never nags: once dismissed it stays hidden for the current linear view, but
 * re-arms on a fresh toggle (any `mode` change resets the dismissal), so a
 * deliberate return to linear surfaces it again. Rendered in a polite `status`
 * region so screen readers hear it without a focus grab.
 */

export interface CompressionHintProps {
  /** Current scale mode; the hint only appears in linear. */
  mode: ViewMode;
  /** Temporal domain `[minSortYears, maxSortYears]` currently in view. */
  domain: readonly [number, number];
  /** Invoked when the reader accepts the suggestion to switch to logarithmic. */
  onSwitchToLogarithmic: () => void;
  className?: string;
}

export const CompressionHint = ({
  mode,
  domain,
  onSwitchToLogarithmic,
  className,
}: CompressionHintProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [prevMode, setPrevMode] = useState(mode);

  // Re-arm on any mode change so a deliberate re-toggle to linear shows the hint
  // again, while a within-linear dismissal stays dismissed. This is React's
  // "reset state when a prop changes" render-phase pattern — no effect, no extra
  // commit — so the reset is applied before the first paint of the new mode.
  if (prevMode !== mode) {
    setPrevMode(mode);
    setDismissed(false);
  }

  if (dismissed || !isSpanCompressed(domain, mode)) return null;

  return (
    <div
      role="status"
      className={cn(
        "ambient-presence flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
        className,
      )}
    >
      <span className="text-foreground-muted">
        Events compressed — switch to logarithmic?
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onSwitchToLogarithmic}
      >
        Switch to logarithmic
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Dismiss compression hint"
        className="ml-auto px-2"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
};

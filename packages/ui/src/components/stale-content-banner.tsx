import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";

/**
 * StaleContentBanner — the reusable connection-loss primitive for the reader.
 *
 * When a screen's Realtime subscription drops, the visible content stays usable
 * (SSR-first) and this banner pins below the nav bar to signal staleness, with
 * a Refresh affordance to re-fetch on demand (screen-inventory §3; motion-spec
 * §3). Every data screen reuses this primitive — #258 ships the primitive only;
 * wiring it to a live subscription is each screen's own ticket.
 *
 * Accessibility (accessibility-spec §4.3):
 *  - `aria-live="polite"` region that announces ONCE on appearance — never
 *    `assertive` (the reader is exploratory, not alerting), and it does not
 *    re-announce on every retry (the message is stable per state).
 *  - The Refresh button is keyboard-reachable and in the natural tab order.
 *  - The banner NEVER auto-focuses — appearance must not steal focus or scroll.
 *  - Color is redundant with text (never color-only).
 *
 * Motion is opacity-only via `.ambient-presence`, collapsing to instant under
 * `prefers-reduced-motion` at the token layer (motion.css).
 */
export type StaleBannerState = "hidden" | "stale" | "reconnecting";

const DEFAULT_MESSAGE: Record<Exclude<StaleBannerState, "hidden">, string> = {
  stale: "Live updates paused — content may be out of date.",
  reconnecting: "Reconnecting…",
};

export interface StaleContentBannerProps {
  state?: StaleBannerState;
  /** Override the default per-state copy. */
  message?: string;
  /** Manual re-fetch handler. The button is omitted while reconnecting. */
  onRefresh?: () => void;
  refreshLabel?: string;
  className?: string;
}

export const StaleContentBanner = ({
  state = "hidden",
  message,
  onRefresh,
  refreshLabel = "Refresh",
  className,
}: StaleContentBannerProps) => {
  const visible = state !== "hidden";
  const text = message ?? (state === "hidden" ? "" : DEFAULT_MESSAGE[state]);

  return (
    // The live region is always present so it can announce when text appears.
    // `aria-atomic` so the whole (short) message is read as one unit.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "ambient-presence",
        visible
          ? "flex items-center justify-between gap-4 border-b border-border-muted bg-surface px-4 py-2 text-sm text-foreground-muted sm:px-6"
          : "sr-only",
        className,
      )}
    >
      {visible ? (
        <>
          <span>{text}</span>
          {state === "stale" && onRefresh ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              className="shrink-0"
            >
              {refreshLabel}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

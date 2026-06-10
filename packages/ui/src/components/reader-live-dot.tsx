import { cn } from "@repo/ui/lib/utils";

/**
 * ReaderLiveDot — the `ambient-presence` live-update indicator that sits near
 * the brand in the reader nav. A 6px dot whose only signal is opacity/color;
 * it must NEVER pulse, blink, slide, or scale (motion-spec §2.5; PRD §2.2.10).
 * Motion is opacity-only via the `.ambient-presence` class (motion.css), which
 * collapses to instant under `prefers-reduced-motion` at the token layer.
 *
 * States (docs/design/public/06-mid-fidelity/00-app-shell.md §Live dot):
 *  - hidden     — idle / no subscription → not announced, fully transparent
 *  - subscribed — active subscription   → `--color-foreground-subtle`
 *  - update     — recent published update → brief opacity rise to `--color-foreground-muted`
 *  - paused     — connection lost        → static, no color alarm
 *
 * Presentational only: the parent drives `state` from Realtime subscription
 * status. This ticket (#258) never starts a subscription — the dot stays
 * `hidden` until a screen ticket drives it.
 */
export type ReaderLiveState = "hidden" | "subscribed" | "update" | "paused";

const STATE_LABEL: Record<ReaderLiveState, string> = {
  hidden: "",
  subscribed: "Live updates active",
  update: "New updates available",
  paused: "Live updates paused",
};

const STATE_CLASS: Record<ReaderLiveState, string> = {
  hidden: "opacity-0 text-foreground-subtle",
  subscribed: "opacity-100 text-foreground-subtle",
  update: "opacity-100 text-foreground-muted",
  paused: "opacity-100 text-foreground-subtle",
};

export interface ReaderLiveDotProps {
  state?: ReaderLiveState;
  className?: string;
}

export const ReaderLiveDot = ({
  state = "hidden",
  className,
}: ReaderLiveDotProps) => {
  const label = STATE_LABEL[state];
  return (
    <span
      data-state={state}
      aria-hidden={state === "hidden" ? true : undefined}
      className={cn(
        "ambient-presence inline-block h-1.5 w-1.5 rounded-full bg-current",
        STATE_CLASS[state],
        className,
      )}
    >
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
};

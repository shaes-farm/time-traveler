import Link from "next/link";
import { BrandMark } from "@repo/ui/components/brand-mark";

/**
 * Landing hero — headline + dual CTAs into the two reader spines, with the brand
 * mark as the accompanying visual
 * (docs/design/public/08-high-fidelity/Time_Traveler_Landing_Final.html).
 * The h1 keeps the shell's focus-target contract (tabIndex={-1}).
 */
export function Hero() {
  return (
    <header className="px-4 pb-10 pt-14 sm:px-10 lg:px-16 lg:pt-18">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-era-mya">
            13.8 billion years · one landscape
          </p>
          <h1
            tabIndex={-1}
            className="mb-6 font-display text-4xl font-normal leading-[1.05] tracking-tight text-foreground outline-none sm:text-5xl lg:text-6xl"
          >
            Everything has a history.
          </h1>
          <p className="mb-6 text-lg leading-relaxed text-foreground-muted">
            History is not a hallway — it is a landscape, vast and connected in
            every direction. Time Traveler is an instrument for seeing across
            all of it: cosmology to last afternoon, real pasts and imagined ones
            alike.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore timelines
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              Read stories
            </Link>
          </div>
        </div>
        {/* Brand visual — defaults to the app mark; a future per-page hero image
            can be threaded through as a prop when one is needed. */}
        <BrandMark
          className="mx-auto hidden w-full max-w-sm sm:block"
          aria-hidden
        />
      </div>
    </header>
  );
}

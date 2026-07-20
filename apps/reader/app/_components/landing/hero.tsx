import Link from "next/link";

/**
 * Landing hero — headline + dual CTAs into the two reader spines
 * (docs/design/public/08-high-fidelity/Time_Traveler_Landing_Final.html).
 * The h1 keeps the shell's focus-target contract (tabIndex={-1}).
 */
export function Hero() {
  return (
    <header className="px-4 pb-10 pt-14 sm:px-10 lg:px-16 lg:pt-18">
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-era-mya">
        13.8 billion years · one continuous map
      </p>
      <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
        <h1
          tabIndex={-1}
          className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground outline-none sm:text-5xl lg:text-6xl"
        >
          See all of time at once — then zoom in.
        </h1>
        <div>
          <p className="mb-6 text-lg leading-relaxed text-foreground-muted">
            An immersive reader for published timelines and stories. Drag across
            eras, drill into any moment, and follow the threads that connect
            them — history as a landscape, not a hallway.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore
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
      </div>
    </header>
  );
}

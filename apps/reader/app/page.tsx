import { ReaderLink } from "../components/reader-link";
import { LandingRails } from "./_components/landing-rails";

/**
 * Reader landing / discovery page (screen 1, route `/`).
 *
 * A statically server-rendered hero + dual CTA (the dual entry point into the
 * timeline-first `/explore` and story-first `/stories` paths), followed by the
 * `LandingRails` client island that fetches and renders recent published
 * content. The hero touches no Supabase env vars, so `/` prerenders cleanly in
 * env-less CI; all data fetching is deferred to the post-mount island.
 *
 * The `h1` is the focus target the shell moves focus to on navigation.
 */
export default function ReaderHomePage() {
  return (
    <div className="space-y-12 py-8">
      <section className="mx-auto max-w-2xl space-y-5 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-subtle">
          Public reader
        </p>
        <h1
          tabIndex={-1}
          className="font-display text-4xl text-foreground outline-none sm:text-5xl"
        >
          Time Traveler
        </h1>
        <p className="font-body text-base text-foreground-muted">
          Explore published timelines, stories, and the people, places, and
          events that shaped them — across the full span of time.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <ReaderLink
            href="/explore"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explore timelines
          </ReaderLink>
          <ReaderLink
            href="/stories"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read stories
          </ReaderLink>
        </div>
      </section>

      <LandingRails />
    </div>
  );
}

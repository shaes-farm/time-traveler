/**
 * Reader landing placeholder. The persistent chrome (nav, footer, skip-link)
 * is supplied by the shell in `app/layout.tsx`; this route only renders the
 * `main` content. The full landing screen (featured/recent rails) is a
 * separate ticket. The `h1` is the focus target on navigation.
 */
export default function ReaderHomePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-foreground-subtle">
        Public reader
      </p>
      <h1
        tabIndex={-1}
        className="font-display text-4xl text-foreground outline-none"
      >
        Time Traveler
      </h1>
      <p className="font-body text-sm text-foreground-muted">
        Explore published timelines, stories, and the people, places, and events
        that shaped them — across the full span of time.
      </p>
    </div>
  );
}

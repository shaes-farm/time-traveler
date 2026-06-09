import Link from "next/link";

/**
 * 404 rendered inside the persistent shell (the shell owns the single `main`
 * landmark, so this renders content only — no nested `<main>`). The `h1` is the
 * focus target on navigation.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-foreground-subtle">
        404
      </p>
      <h1
        tabIndex={-1}
        className="font-display text-4xl text-foreground outline-none"
      >
        This page is outside the timeline
      </h1>
      <p className="font-body text-sm text-foreground-muted">
        The reader route you requested is not available.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to reader home
      </Link>
    </div>
  );
}

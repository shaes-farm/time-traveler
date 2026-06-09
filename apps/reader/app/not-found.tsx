import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-subtle">
          404
        </p>
        <h1 className="font-display text-4xl text-foreground">
          This page is outside the timeline
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          The reader route you requested is not available yet.
        </p>
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to reader home
        </Link>
      </div>
    </main>
  );
}

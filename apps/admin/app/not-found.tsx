import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-subtle">
          404
        </p>
        <h1 className="font-display text-4xl text-foreground">
          Not found in this era
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          This route hasn&apos;t been authored yet, or the resource has been
          archived. Head back to the dashboard to continue.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

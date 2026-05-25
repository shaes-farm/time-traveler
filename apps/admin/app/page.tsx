/**
 * Placeholder home page — proves the Tailwind 4 + token + Google Fonts
 * pipeline. Real routes ship in later fidelity-2 batches.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="font-display text-5xl">Time Traveler</h1>
        <p className="font-body text-foreground-muted">
          Temporal content management — admin
        </p>
        <p className="font-mono text-foreground-subtle text-sm">
          Tailwind 4 + design tokens loaded.
        </p>
      </div>
    </main>
  );
}

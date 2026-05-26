interface PublicTimelinePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicTimelinePage({
  params,
}: PublicTimelinePageProps) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-display text-4xl text-foreground">{slug}</h1>
      <p className="font-body text-sm text-foreground-muted">
        Public timeline rendering — placeholder until the dedicated reader
        surface lands.
      </p>
      <p className="font-mono text-xs text-foreground-subtle">
        Placeholder · public route group, no auth gate
      </p>
    </main>
  );
}

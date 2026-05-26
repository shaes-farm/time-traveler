import { Skeleton } from "@repo/ui/components/skeleton";

interface PlaceholderPageProps {
  title: string;
  description: string;
  /** Issue or batch that will fill this surface in. */
  trackedIn: string;
  /** Number of skeleton list rows to render. */
  rows?: number;
}

export function PlaceholderPage({
  title,
  description,
  trackedIn,
  rows = 5,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        <p className="font-body text-sm text-foreground-muted">{description}</p>
        <p className="font-mono text-xs text-foreground-subtle">
          Placeholder · real content lands in {trackedIn}
        </p>
      </header>
      <div className="space-y-2 rounded-md border border-border bg-surface p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

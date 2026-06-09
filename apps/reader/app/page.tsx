import { Button } from "@repo/ui/components/button";
import { timelineVisibilityEnum } from "@repo/services/schemas/timeline";

export default function ReaderHomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl space-y-4 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-subtle">
          Reader app scaffold
        </p>
        <h1 className="font-display text-4xl text-foreground">
          Time Traveler Reader
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Public read-only routes will be added in follow-up tickets.
        </p>
        <p className="font-mono text-xs text-foreground-subtle">
          Shared services wired: visibility values include{" "}
          {timelineVisibilityEnum.options.join(", ")}.
        </p>
        <div className="flex justify-center">
          <Button type="button">Placeholder route ready</Button>
        </div>
      </div>
    </main>
  );
}

import { cn } from "@repo/ui/lib/utils";
import { Card } from "@repo/ui/components/card";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import {
  DefaultReaderLink,
  type ReaderLinkComponent,
} from "@repo/ui/components/reader-link";
import type { TemporalData } from "@repo/services/schemas/temporal";

/**
 * ReaderTimelineCard — a single published-timeline preview for the reader's
 * discovery rails (screen 1) and, later, the Explore grid.
 *
 * Decoupled from the full Supabase row: callers pass only the fields a card
 * shows, so the component carries no service/DB coupling and stays trivially
 * testable. The canonical date visual is `TemporalDisplay`, fed from the
 * timeline's `temporal_data` (and `end_temporal_data` as the range end) — the
 * one reader-card that has a temporal anchor (stories do not).
 *
 * The whole card is a single link (the title is the accessible name); per-card
 * deep links to the timeline reader are deferred (no detail route / username
 * join yet, #259), so the landing rails point cards at `/explore`.
 */
export interface ReaderTimelineCardData {
  title: string;
  summary?: string | null;
  temporalData: TemporalData;
  endTemporalData?: TemporalData | null;
}

export interface ReaderTimelineCardProps {
  timeline: ReaderTimelineCardData;
  /** Destination for the card link. */
  href: string;
  /** Framework link adapter (e.g. `next/link`). Falls back to a plain `<a>`. */
  LinkComponent?: ReaderLinkComponent;
  className?: string;
}

export const ReaderTimelineCard = ({
  timeline,
  href,
  LinkComponent = DefaultReaderLink,
  className,
}: ReaderTimelineCardProps) => {
  const { title, summary, temporalData, endTemporalData } = timeline;
  return (
    <Card
      className={cn(
        "flex h-full w-72 shrink-0 flex-col gap-3 p-4 transition-colors hover:border-border",
        className,
      )}
    >
      <LinkComponent
        href={href}
        className="font-display text-lg leading-tight text-foreground outline-none focus-visible:underline"
      >
        {title}
      </LinkComponent>
      <TemporalDisplay
        value={temporalData}
        endValue={endTemporalData ?? undefined}
        format="compact"
        className="text-sm"
      />
      {summary ? (
        <p className="line-clamp-3 font-body text-sm text-foreground-muted">
          {summary}
        </p>
      ) : null}
    </Card>
  );
};

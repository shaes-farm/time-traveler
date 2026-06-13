import { cn } from "@repo/ui/lib/utils";
import { Card } from "@repo/ui/components/card";
import {
  DefaultReaderLink,
  type ReaderLinkComponent,
} from "@repo/ui/components/reader-link";

/**
 * ReaderStoryCard — a single published-story preview for the reader's discovery
 * rails (screen 1) and, later, the Story browser grid.
 *
 * Stories carry no temporal anchor (no `temporal_data` column), so — unlike
 * {@link ReaderTimelineCard} — this card renders NO `TemporalDisplay`. Its
 * orienting metadata is the narrative voice (`narrator_type`) shown as a chip,
 * plus an optional subtitle/summary. Per-card deep links to the story reader
 * are deferred (#259); the landing rails point cards at `/stories`.
 */
export type StoryNarratorType = "first_person" | "third_person" | "omniscient";

const NARRATOR_LABEL: Record<StoryNarratorType, string> = {
  first_person: "First person",
  third_person: "Third person",
  omniscient: "Omniscient",
};

export interface ReaderStoryCardData {
  title: string;
  subTitle?: string | null;
  summary?: string | null;
  narratorType?: StoryNarratorType | null;
}

export interface ReaderStoryCardProps {
  story: ReaderStoryCardData;
  /** Destination for the card link. */
  href: string;
  /** Framework link adapter (e.g. `next/link`). Falls back to a plain `<a>`. */
  LinkComponent?: ReaderLinkComponent;
  className?: string;
}

export const ReaderStoryCard = ({
  story,
  href,
  LinkComponent = DefaultReaderLink,
  className,
}: ReaderStoryCardProps) => {
  const { title, subTitle, summary, narratorType } = story;
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
      {subTitle ? (
        <p className="font-body text-sm text-foreground-muted">{subTitle}</p>
      ) : null}
      {summary ? (
        <p className="line-clamp-3 font-body text-sm text-foreground-muted">
          {summary}
        </p>
      ) : null}
      {narratorType ? (
        <span className="mt-auto inline-flex w-fit items-center rounded-full border border-border-muted px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
          {NARRATOR_LABEL[narratorType]}
        </span>
      ) : null}
    </Card>
  );
};

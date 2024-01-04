import type {
  SanityCategory,
  SanityEvent,
  SanityPeriod,
  SanityTimeline
} from '../models/sanity-model';
import type {
  Category,
  HistoricalEvent,
  Period,
  Timeline
} from '../models/app-model';

export const mapApiCategoryToModel = ({
  slug,
  title,
  events,
}: SanityCategory): Category => ({
  slug,
  title,
  events: events?.result?.map((e) => mapApiEventToModel(e)) ?? [],
});

export const mapApiEventToModel = ({
  slug,
  title,
  summary,
  detail,
  categories,
  importance,
  location,
  beginDate,
  endDate,
  media,
  timelines,
}: SanityEvent): HistoricalEvent => ({
  slug,
  title,
  summary,
  detail,
  categories: categories?.result?.map((c) => mapApiCategoryToModel(c)) ?? [],
  importance,
  location,
  beginDate,
  endDate,
  media: media?.result?.map((m) => m) ?? [],
  timelines: timelines?.result?.map((t) => mapApiTimelineToModel(t)) ?? [],
});

export const mapApiPeriodToModel = ({
  slug,
  title,
  summary,
  beginDate,
  endDate,
  timelines,
}: SanityPeriod): Period => ({
  slug,
  title,
  summary,
  beginDate,
  endDate,
  timelines: timelines?.result?.map((t) => mapApiTimelineToModel(t)) ?? [],
});

export const mapApiTimelineToModel = ({
  slug,
  title,
  summary,
  scale,
  beginDate,
  endDate,
  events,
  periods,
}: SanityTimeline): Timeline => ({
  slug,
  title,
  summary,
  scale,
  beginDate,
  endDate,
  events: events?.result?.map((e) => mapApiEventToModel(e)) ?? [],
  periods: periods?.result?.map((p) => mapApiPeriodToModel(p)) ?? [],
});

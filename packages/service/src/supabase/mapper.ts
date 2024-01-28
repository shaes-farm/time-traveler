import type {
  Category,
  HistoricalEvent,
  Media,
  Period,
  PostgrestCategory,
  PostgrestHistoricalEvent,
  PostgrestMedia,
  PostgrestPeriod,
  PostgrestTimeline,
  Timeline,
} from '../models';

export const mapApiPeriodToModel = ({
  slug,
  title,
  summary,
  begin_date: beginDate,
  end_date: endDate,
  timelines,
}: PostgrestPeriod): Period => ({
  slug,
  title,
  summary: summary ?? null,
  beginDate,
  endDate,
  timelines: timelines?.map((t) => mapApiTimelineToModel(t)) ?? [],
});

export const mapApiTimelineToModel = ({
  slug,
  title,
  summary,
  scale,
  begin_date: beginDate,
  end_date: endDate,
  historical_events: events,
  periods,
}: PostgrestTimeline): Timeline => ({
  slug,
  title,
  summary: summary ?? null,
  scale: scale ?? null,
  beginDate,
  endDate,
  events: events?.map((e) => mapApiEventToModel(e)) ?? [],
  periods: periods?.map((p) => mapApiPeriodToModel(p)) ?? [],
});

export const mapApiEventToModel = ({
  slug,
  title,
  summary,
  detail,
  categories,
  importance,
  location,
  begin_date: beginDate,
  end_date: endDate,
  media,
  timelines,
}: PostgrestHistoricalEvent): HistoricalEvent => ({
  slug,
  title,
  summary,
  detail,
  categories: categories?.map((c) => mapApiCategoryToModel(c)) ?? [],
  importance,
  location,
  beginDate,
  endDate,
  media: media?.map((m) => mapApiMediaToModel(m)) ?? [],
  timelines: timelines?.map((t) => mapApiTimelineToModel(t)) ?? [],
});

export const mapApiCategoryToModel = ({
  slug,
  title,
  events,
}: PostgrestCategory): Category => ({
  slug,
  title,
  events: events?.map((e) => mapApiEventToModel(e)) ?? [],
});

export const mapApiMediaToModel = ({
  slug,
  alternativetext: alternativeText,
  caption,
  url,
  width,
  height,
  formats,
}: PostgrestMedia): Media => ({
  slug,
  alternativeText,
  caption,
  url,
  width,
  height,
  formats,
});

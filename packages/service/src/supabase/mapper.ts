import type {
  Category,
  HistoricalEvent,
  Period,
  PostgrestCategory,
  PostgrestHistoricalEvent,
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
  summary,
  beginDate,
  endDate,
  timelines: timelines?.map((t) => mapApiTimelineToModel(t as PostgrestTimeline)) ?? [],
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
  summary,
  scale,
  beginDate,
  endDate,
  events: events?.map((e) => mapApiEventToModel(e as PostgrestHistoricalEvent)) ?? [],
  periods: periods?.map((p) => mapApiPeriodToModel(p as PostgrestPeriod)) ?? [],
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
  categories: categories?.map((c) => mapApiCategoryToModel(c as PostgrestCategory)) ?? [],
  importance,
  location,
  beginDate,
  endDate,
  media: media?.map((m) => m) ?? [],
  timelines: timelines?.map((t) => mapApiTimelineToModel(t as PostgrestTimeline)) ?? [],
});

export const mapApiCategoryToModel = ({
  slug,
  title,
  events,
}: PostgrestCategory): Category => ({
  slug,
  title,
  events: events?.map((e) => mapApiEventToModel(e as PostgrestHistoricalEvent)) ?? [],
});

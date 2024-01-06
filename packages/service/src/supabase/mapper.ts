import type {
  Category,
  HistoricalEvent,
  Period,
  Timeline
} from '../models/app-model';

export const mapApiPeriodToModel = ({
  slug,
  title,
  summary,
  begin_date: beginDate,
  end_date: endDate,
  timelines,
}): Period => ({
  slug,
  title,
  summary,
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
  historical_events,
  periods,
}): Timeline => ({
  slug,
  title,
  summary,
  scale,
  beginDate,
  endDate,
  events: historical_events?.map((e) => mapApiEventToModel(e)) ?? [],
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
}): HistoricalEvent => ({
  slug,
  title,
  summary,
  detail,
  categories: categories?.map((c) => mapApiCategoryToModel(c)) ?? [],
  importance,
  location,
  beginDate,
  endDate,
  media: media?.map((m) => m) ?? [],
  timelines: timelines?.map((t) => mapApiTimelineToModel(t)) ?? [],
});

export const mapApiCategoryToModel = ({
  slug,
  title,
  events,
}): Category => ({
  slug,
  title,
  events: events?.map((e) => mapApiEventToModel(e)) ?? [],
});

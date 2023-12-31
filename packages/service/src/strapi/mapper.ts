import type {
  StrapiCategory,
  StrapiEvent,
  StrapiPeriod,
  StrapiTimeline
} from '../models/strapi-model';
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
}: StrapiCategory): Category => ({
  slug,
  title,
  events: events?.data?.map((e) => mapApiEventToModel(e.attributes)) ?? [],
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
}: StrapiEvent): HistoricalEvent => ({
  slug,
  title,
  summary,
  detail,
  categories: categories?.data?.map((c) => mapApiCategoryToModel(c.attributes)) ?? [],
  importance,
  location,
  beginDate,
  endDate,
  media: media?.data?.map((m) => m.attributes) ?? [],
  timelines: timelines?.data?.map((t) => mapApiTimelineToModel(t.attributes)) ?? [],
});

export const mapApiPeriodToModel = ({
  slug,
  title,
  summary,
  beginDate,
  endDate,
  timelines,
}: StrapiPeriod): Period => ({
  slug,
  title,
  summary,
  beginDate,
  endDate,
  timelines: timelines?.data?.map((t) => mapApiTimelineToModel(t.attributes)) ?? [],
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
}: StrapiTimeline): Timeline => ({
  slug,
  title,
  summary,
  scale,
  beginDate,
  endDate,
  events: events?.data?.map((e) => mapApiEventToModel(e.attributes)) ?? [],
  periods: periods?.data?.map((p) => mapApiPeriodToModel(p.attributes)) ?? [],
});

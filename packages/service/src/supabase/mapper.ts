import type {
  Category,
  HistoricalEvent,
  Media,
  Period,
  Profile,
  PostgrestCategory,
  PostgrestHistoricalEvent,
  PostgrestMedia,
  PostgrestPeriod,
  PostgrestProfile,
  PostgrestTimeline,
  Timeline,
} from '../models';

export const mapApiPeriodToModel = ({
  user_id: userId,
  slug,
  title,
  summary,
  begin_date: beginDate,
  end_date: endDate,
  timelines,
}: PostgrestPeriod): Period => ({
  userId,
  slug,
  title,
  summary: summary ?? null,
  beginDate,
  endDate,
  timelines: timelines?.map((t) => mapApiTimelineToModel(t)) ?? [],
});

export const mapApiTimelineToModel = ({
  user_id: userId,
  slug,
  title,
  summary,
  scale,
  begin_date: beginDate,
  end_date: endDate,
  historical_events: events,
  periods,
}: PostgrestTimeline): Timeline => ({
  userId,
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
  user_id: userId,
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
  userId,
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
  user_id: userId,
  slug,
  title,
  events,
}: PostgrestCategory): Category => ({
  userId,
  slug,
  title,
  events: events?.map((e) => mapApiEventToModel(e)) ?? [],
});

export const mapApiMediaToModel = ({
  user_id: userId,
  slug,
  alternativetext: alternativeText,
  caption,
  url,
  width,
  height,
  formats,
}: PostgrestMedia): Media => ({
  userId,
  slug,
  alternativeText,
  caption,
  url,
  width,
  height,
  formats,
});

export const mapApiProfileToModel = ({
  id,
  first_name: firstName,
  last_name: lastName,
  bio,
  website,
  avatar_url: avatarUrl,
}: PostgrestProfile): Profile => ({
  id,
  firstName,
  lastName,
  bio,
  website,
  avatarUrl,
});

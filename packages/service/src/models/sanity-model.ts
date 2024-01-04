import type {Media} from './app-model';

export interface SanityMediaResponse {
  result: Media[] | null;
}

export interface SanityCategory {
  slug: string;
  title: string;
  events?: SanityEventResponse;
}

export interface SanityCategoryResponse {
  result: SanityCategory | null;
}

export interface SanityCategoriesResponse {
  result: SanityCategory[] | null;
}

export interface SanityEvent {
  slug: string;
  title: string;
  summary: string | null;
  detail: string | null;
  importance: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  location: string | null;
  beginDate: string;
  endDate: string | null;
  categories?: SanityCategoriesResponse;
  media?: SanityMediaResponse;
  timelines?: SanityTimelineResponse;
}

export interface SanityEventResponse {
  result: SanityEvent[] | null;
}

export interface SanityTimeline {
  slug: string;
  title: string;
  summary: string | null;
  scale: string | null;
  beginDate: string;
  endDate: string;
  events?: SanityEventResponse;
  periods?: SanityPeriodsResponse;
}

export interface SanityTimelineResponse {
  result: SanityTimeline[] | null;
}

export interface SanityPeriod {
  slug: string;
  title: string;
  summary: string | null;
  beginDate: string;
  endDate: string;
  timelines?: SanityTimelineResponse;
}

export interface SanityPeriodsResponse {
  query: string;
  result: SanityPeriod[] | null;
  ms: number;
}

import type {Media} from './app-model';

export interface StrapiMediaAttributes {
  attributes: Media;
}

export interface StrapiMediaResponse {
  data: StrapiMediaAttributes[] | null;
}

export interface StrapiCategory {
  slug: string;
  title: string;
  events?: StrapiEventResponse;
}

export interface StrapiCategoryAttributes {
  attributes: StrapiCategory;
}

export interface StrapiCategoryResponse {
  data: StrapiCategoryAttributes | null;
}

export interface StrapiCategoriesResponse {
  data: StrapiCategoryAttributes[] | null;
}

export interface StrapiEvent {
  title: string;
  slug: string;
  summary: string | null;
  detail: string | null;
  importance: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  location: string | null;
  beginDate: string;
  endDate: string | null;
  categories?: StrapiCategoriesResponse;
  media?: StrapiMediaResponse;
  timelines?: StrapiTimelineResponse;
}

export interface StrapiEventAttributes {
  attributes: StrapiEvent;
}

export interface StrapiEventResponse {
  data: StrapiEventAttributes[] | null;
}

export interface StrapiTimeline {
  slug: string;
  title: string;
  summary: string | null;
  scale: string | null;
  beginDate: string;
  endDate: string;
  events?: StrapiEventResponse;
  periods?: StrapiPeriodsResponse;
}

export interface StrapiTimelineAttributes {
  attributes: StrapiTimeline;
}

export interface StrapiTimelineResponse {
  data: StrapiTimelineAttributes[] | null;
}

export interface StrapiPeriod {
  title: string;
  slug: string;
  summary: string | null;
  beginDate: string;
  endDate: string;
  timelines?: StrapiTimelineResponse;
}

export interface StrapiPeriodAttributes {
  attributes: StrapiPeriod;
}

export interface StrapiPeriodsResponse {
  data: StrapiPeriodAttributes[] | null;
}

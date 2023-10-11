import type {Media} from './event-model';

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
  summary?: string;
  categories?: StrapiCategoriesResponse;
  importance: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  location?: string;
  beginDate: string;
  endDate?: string;
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
  name: string;
  summary?: string;
  scale?: string;
  events?: StrapiEventResponse;
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
  summary?: string;
  beginDate: string;
  endDate?: string;
  timelines?: StrapiTimelineResponse;
}

export interface StrapiPeriodAttributes {
  attributes: StrapiPeriod;
}

export interface StrapiPeriodResponse {
  data: StrapiPeriodAttributes[] | null;
}

export interface Media {
  userId?: string;
  slug: string;
  alternativeText?: string;
  caption?: string;
  url:string;
  width?: number;
  height?: number;
  formats?: string;
}

export enum Importance {
  Insignificant = 1,
  Trivial,
  Minor,
  Average,
  Medium,
  Moderate,
  Influential,
  Significant,
  Major,
  Shaping,
  Defining,
}

export interface HistoricalEvent {
  userId?: string;
  slug: string;
  title: string;
  summary: string | null;
  detail: string | null;
  location: string | null;
  importance: Importance;
  beginDate: string;
  endDate: string | null;
  published: boolean;
  publishedAt: string | null;
  timeline?: Timeline;
  categories: Category[];
  timelines: Timeline[];
  media: Media[];
}

export interface Category {
  userId?: string;
  slug: string;
  title: string;
  events: HistoricalEvent[];
}

export interface Timeline {
  userId?: string;
  slug: string;
  title: string;
  summary: string | null;
  detail: string | null;
  scale: string | null;
  beginDate: string;
  endDate: string;
  published: boolean;
  publishedAt: string | null;
  events: HistoricalEvent[];
  periods?: Period[];
}

export interface Period {
  userId?: string;
  slug: string;
  title: string;
  summary: string | null;
  detail: string | null;
  beginDate: string;
  endDate: string;
  published: boolean;
  publishedAt: string | null;
  timelines: Timeline[];
}

export interface Story {
  userId?: string;
  slug: string;
  title: string;
  subTitle: string | null;
  summary: string | null;
  detail: string | null;
  published: boolean;
  publishedAt: string | null;
  periods: Period[];
}

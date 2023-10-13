export interface Media {
  alternativeText: string;
  caption: string;
  url:string;
  width: number;
  height: number;
  formats: object;
}

export enum Importance {
  Low = 1,
  Trivial,
  Minor,
  Average,
  Medium,
  Moderate,
  Influential,
  Shaping,
  Major,
  Defining,
}

export interface HistoricalEvent {
  title: string;
  slug: string;
  summary?: string;
  categories: Category[];
  location?: string;
  importance: Importance;
  beginDate: string;
  endDate?: string;
  timeline?: Timeline;
  timelines: Timeline[];
  media: Media[];
}

export interface Category {
  title: string;
  slug: string;
  events: HistoricalEvent[];
}

export interface Timeline {
  title: string;
  slug: string;
  summary?: string;
  scale?: string;
  events: HistoricalEvent[];
  periods: Period[];
}

export interface Period {
  title: string;
  slug: string;
  summary?: string;
  beginDate: string;
  endDate?: string;
  timelines: Timeline[];
}

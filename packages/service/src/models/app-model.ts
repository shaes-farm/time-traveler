export interface Media {
  slug: string;
  alternativeText?: string;
  caption?: string;
  url?:string;
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
  Major,
  Significant,
  Shaping,
  Defining,
}

export interface HistoricalEvent {
  slug: string;
  title: string;
  summary: string | null;
  detail: string | null;
  location: string | null;
  importance: Importance;
  beginDate: string;
  endDate: string | null;
  timeline?: Timeline;
  categories: Category[];
  timelines: Timeline[];
  media: Media[];
}

export interface Category {
  slug: string;
  title: string;
  events: HistoricalEvent[];
}

export interface Timeline {
  slug: string;
  title: string;
  summary: string | null;
  scale: string | null;
  beginDate: string;
  endDate: string;
  events: HistoricalEvent[];
  periods?: Period[];
}

export interface Period {
  slug: string;
  title: string;
  summary: string | null;
  beginDate: string;
  endDate: string;
  timelines: Timeline[];
}

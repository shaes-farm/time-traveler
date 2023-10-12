export interface Media {
  alternativeText: string;
  caption: string;
  url:string;
  width: number;
  height: number;
  formats: object;
}

export interface HistoricalEvent {
  title: string;
  slug: string;
  summary?: string;
  categories: Category[];
  location?: string;
  importance: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
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

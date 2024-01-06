export interface PostgrestPeriod {
  slug: string;
  title: string;
  summary: string;
  begin_date: string;
  end_date: string;
  timelines?: Partial<PostgrestTimeline>[];
}

export interface PostgrestTimeline {
  slug: string;
  title: string;
  summary: string;
  scale: string;
  begin_date: string;
  end_date: string;
  historical_events?: Partial<PostgrestHistoricalEvent>[];
  periods?: Partial<PostgrestPeriod>[];
}

export interface PostgrestHistoricalEvent {
  slug: string;
  title: string;
  summary: string;
  detail: string;
  categories?: Partial<PostgrestCategory>[];
  importance: number;
  location: string;
  begin_date: string;
  end_date: string;
  media?: Partial<PostgrestMedia>[];
  timelines?: Partial<PostgrestTimeline>[];
}

export interface PostgrestCategory {
  slug: string;
  title: string;
  events?: Partial<PostgrestHistoricalEvent>[];
}

export interface PostgrestMedia {
  alternativeText: string;
  caption: string;
  url:string;
  width: number;
  height: number;
  formats: object;
}
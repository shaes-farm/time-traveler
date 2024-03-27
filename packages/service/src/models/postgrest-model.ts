import type {PostgrestSingleResponse} from '@supabase/postgrest-js';
import type {Database} from './supabase-model';

export interface PostgrestStory {
  user_id?: string;
  slug: string;
  title: string;
  sub_title?: string;
  summary?: string;
  detail?: string;
  periods?: PostgrestPeriod[];
}

export interface PostgrestPeriod {
  user_id?: string;
  slug: string;
  title: string;
  summary?: string;
  detail?: string;
  begin_date: string;
  end_date: string;
  timelines?: PostgrestTimeline[];
}

export interface PostgrestTimeline {
  user_id?: string;
  slug: string;
  title: string;
  summary?: string;
  detail?: string;
  scale?: string;
  begin_date: string;
  end_date: string;
  historical_events?: PostgrestHistoricalEvent[];
  periods?: PostgrestPeriod[];
}

export interface PostgrestHistoricalEvent {
  user_id?: string;
  slug: string;
  title: string;
  summary: string;
  detail: string;
  categories?: PostgrestCategory[];
  importance: number;
  location: string;
  begin_date: string;
  end_date: string;
  media?: PostgrestMedia[];
  timelines?: PostgrestTimeline[];
}

export interface PostgrestCategory {
  user_id?: string;
  slug: string;
  title: string;
  events?: PostgrestHistoricalEvent[];
}

export interface PostgrestMedia {
  user_id?: string;
  slug: string;
  alternativetext?: string;
  caption?: string;
  url:string;
  width?: number;
  height?: number;
  formats?: string;
}

export interface PostgrestProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  social_x?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_pinterest?: string;
  social_youtube?: string;
}

export interface ModelResult<Type> {
  data: Type;
  error: object;
  loading: boolean;
}

export interface ModelCollection<Type> {
  data: Type[];
  error: object;
  loading: boolean;
}

export interface Model<Type> {
  find: (query: Type) => ModelCollection<Type>
  findOne: (query: Type) => ModelResult<Type>
  insert: (data: Type) => ModelResult<Type>
  update: (data: Type) => ModelResult<Type>
  delete: (data: Type) => ModelResult<Type>
}

export type PeriodSchema = Database['public']['Tables']['periods']['Row'];
export type PeriodInsert = Database['public']['Tables']['periods']['Insert'];
export type PeriodUpdate = Database['public']['Tables']['periods']['Update'];

export type PeriodModel = Model<PeriodSchema>;
export type PeriodResult = ModelResult<PeriodSchema>;
export type PeriodCollection = ModelCollection<PeriodSchema>;
export type PeriodSingleResponse = PostgrestSingleResponse<PeriodSchema>;

export type TimelineSchema = Database['public']['Tables']['timelines']['Row'];
export type TimelineInsert = Database['public']['Tables']['timelines']['Insert'];
export type TimelineUpdate = Database['public']['Tables']['timelines']['Update'];

export type TimelineModel = Model<TimelineSchema>;
export type TimelineResult = ModelResult<TimelineSchema>;
export type TimelineCollection = ModelCollection<TimelineSchema>;

export type HistoricalEventSchema = Database['public']['Tables']['historical_events']['Row'];
export type HistoricalEventInsert = Database['public']['Tables']['historical_events']['Insert'];
export type HistoricalEventUpdate = Database['public']['Tables']['historical_events']['Update'];

export type HistoricalEventModel = Model<HistoricalEventSchema>;
export type HistoricalEventResult = ModelResult<HistoricalEventSchema>;
export type HistoricalEventCollection = ModelCollection<HistoricalEventSchema>;

export type CategorySchema = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type CategoryModel = Model<CategorySchema>;
export type CategoryResult = ModelResult<CategorySchema>;
export type CategoryCollection = ModelCollection<CategorySchema>;

export type MediaSchema = Database['public']['Tables']['media']['Row'];
export type MediaInsert = Database['public']['Tables']['media']['Insert'];
export type MediaUpdate = Database['public']['Tables']['media']['Update'];

export type MediaModel = Model<MediaSchema>;
export type MediaResult = ModelResult<MediaSchema>;
export type MediaCollection = ModelCollection<MediaSchema>;

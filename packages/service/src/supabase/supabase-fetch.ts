/* eslint-disable @typescript-eslint/no-throw-literal -- throw supabase errors */
import { createClient, type QueryData, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Category,
  Database,
  HistoricalEvent,
  Media,
  Period,
  PostgrestCategory,
  PostgrestHistoricalEvent,
  PostgrestMedia,
  PostgrestPeriod,
  PostgrestTimeline,
  Timeline,
} from '../models';
import type { Fetch } from '../types';
import {
  mapApiCategoryToModel,
  mapApiEventToModel,
  mapApiMediaToModel,
  mapApiPeriodToModel,
  mapApiTimelineToModel,
} from './mapper';

const { debug } = console;

export class SupabaseFetch implements Fetch {
  baseUrl: string;
  supabase: SupabaseClient<Database>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Create a single supabase client for interacting with your database
    this.supabase = createClient<Database>(baseUrl, process.env.SUPABASE_ANON_KEY ?? '');
  }

  /**
   * Fetch all periods from the API.
   * 
   * @returns An array of Period objects.
   */
  async getPeriods(): Promise<Period[]> {
    const { data, error } = await this.supabase.from('periods').select(`
        slug,
        title,
        summary,
        begin_date,
        end_date,
        timelines (
            slug,
            title,
            summary,
            begin_date,
            end_date
        )
    `);
    if (error) throw error;
    const periods = data as PostgrestPeriod[] | null;
    debug({ periods: JSON.stringify(periods, null, 2) });
    return periods ? periods.map((period) => mapApiPeriodToModel(period)) : [];
  }

  /**
   * Fetch a period by slug.
   * 
   * @returns A Period object if found, otherwise null.
   */
  async getPeriod(slug: string): Promise<Period | null> {
    debug({ slug });
    const { data, error } = await this.supabase.from('periods').select(`
        slug,
        title,
        summary,
        begin_date,
        end_date,
        timelines!period_timelines (
            slug,
            title,
            summary,
            begin_date,
            end_date
        )
    `)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    const period = data as PostgrestPeriod | null;
    debug({ period: JSON.stringify(period, null, 2) });
    return period ? mapApiPeriodToModel(period) : null;
  }

  /**
   * Fetch all timelines from the API.
   *
   * @returns An array of Timeline objects.
   */
  async getTimelines(): Promise<Timeline[]> {
    const { data, error } = await this.supabase.from('timelines').select(`
      slug,
      title,
      summary,
      scale,
      begin_date,
      end_date
    `);
    if (error) throw error;
    debug({ data });
    const timelines = data as PostgrestTimeline[];
    debug({ timelines: JSON.stringify(timelines, null, 2) });
    return timelines.map((timeline) => mapApiTimelineToModel(timeline));
  }

  /**
   * Fetch a timeline by slug.
   * 
   * @returns A Timeline object if found, otherwise null.
   */
  async getTimeline(slug: string): Promise<Timeline | null> {
    debug({ slug });
    const timelineQuery = this.supabase
      .from('timelines')
      .select(`
            slug,
            title,
            summary,
            scale,
            begin_date,
            end_date,
            historical_events!timeline_events (
                slug,
                title,
                summary,
                detail,
                location,
                importance,
                begin_date,
                end_date,
                categories!event_categories (
                    slug,
                    title
                )
            )
        `)
      .eq('slug', slug)
      .order('begin_date')
      .maybeSingle();

    const { data, error } = await timelineQuery;
    if (error) throw error;
    type TimelineEvents = QueryData<typeof timelineQuery>;
    const timeline: TimelineEvents | null = data;
    debug({ timeline: JSON.stringify(timeline, null, 2) });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- fix this
    // @ts-expect-error
    return timeline ? mapApiTimelineToModel(timeline) : null;
  }

  /**
   * Fetch all events from the API.
   *
   * @returns An array of event objects.
   */
  async getEvents(): Promise<HistoricalEvent[]> {
    const { data, error } = await this.supabase.from('historical_events').select(`
      slug,
      title,
      summary,
      detail,
      location,
      importance,
      begin_date,
      end_date
    `);
    if (error) throw error;
    debug({ data });
    const events = data as PostgrestHistoricalEvent[];
    debug({ events: JSON.stringify(events, null, 2) });
    return events.map((event) => mapApiEventToModel(event));
  }

  /**
   * Fetch an event by slug.
   * 
   * @returns An event object if found, otherwise null.
   */
  async getEvent(slug: string): Promise<HistoricalEvent | null> {
    debug({ slug });
    const eventQuery = this.supabase
      .from('historical_events')
      .select(`
            slug,
            title,
            summary,
            detail,
            location,
            importance,
            begin_date,
            end_date,
            timelines!timeline_events (
              slug,
              title,
              summary,
              scale,
              begin_date,
              end_date
            ),
            media!event_media (
              slug,
              alternativetext,
              caption,
              url,
              width,
              height,
              formats
            ),
            categories!event_categories (
              slug,
              title
            )
        `)
      .eq('slug', slug)
      .order('begin_date')
      .maybeSingle();

    const { data, error } = await eventQuery;
    if (error) throw error;
    type HistoricalEventData = QueryData<typeof eventQuery>;
    const event: HistoricalEventData | null = data;
    debug({ event: JSON.stringify(event, null, 2) });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- fix this
    // @ts-expect-error
    return event ? mapApiEventToModel(event) : null;
  }

  /**
   * Fetch all categories from the API.
   *
   * @returns An array of category objects.
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.from('categories').select(`
      slug,
      title
    `);
    if (error) throw error;
    debug({ data });
    const categories = data as PostgrestCategory[];
    debug({ categories: JSON.stringify(categories, null, 2) });
    return categories.map((category) => mapApiCategoryToModel(category));
  }

  /**
   * Fetch a category by slug.
   * 
   * @returns An category object if found, otherwise null.
   */
  async getCategory(slug: string): Promise<Category | null> {
    debug({ slug });
    const { data, error } = await this.supabase.from('categories').select(`
        slug,
        title,
        historical_events!event_categories (
            slug,
            title,
            summary,
            begin_date,
            end_date
        )
      `)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    const category = data as PostgrestPeriod | null;
    debug({ category: JSON.stringify(category, null, 2) });
    return category ? mapApiCategoryToModel(category) : null;
  }

  /**
   * Fetch all media from the API.
   *
   * @returns An array of media objects.
   */
  async getMedia(): Promise<Media[]> {
    const { data, error } = await this.supabase.from('media').select(`
      slug,
      alternativetext,
      caption,
      url,
      width,
      height,
      formats
      `);
    if (error) throw error;
    debug({ data });
    const media = data as PostgrestMedia[] | null;
    debug({ media: JSON.stringify(media, null, 2) });
    return media ? media.map((item) => mapApiMediaToModel(item)) : [];
  }

  /**
   * Fetch a media item by slug.
   * 
   * @returns An media object if found, otherwise null.
   */
  async getMediaItem(slug: string): Promise<Media | null> {
    debug({ slug });
    const { data, error } = await this.supabase.from('media').select(`
        slug,
        alternativetext,
        caption,
        url,
        width,
        height,
        formats
      `)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    const media = data as PostgrestMedia | null;
    debug({ media: JSON.stringify(media, null, 2) });
    return media ? mapApiMediaToModel(media) : null;
  }

};

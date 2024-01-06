/* eslint-disable @typescript-eslint/no-throw-literal -- throw supabase errors */
import { createClient, type QueryData, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  HistoricalEvent,
  Period,
  PostgrestPeriod,
  Timeline,
} from '../models';
import type { Fetch } from '../types';
import {
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
    const periodsQuery = this.supabase.from('periods').select(`
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
    // type PeriodTimelines = QueryData<typeof periodsQuery>;
    const { data, error } = await periodsQuery;
    if (error) throw error;
    const periods = data as PostgrestPeriod[];
    debug({ periods: JSON.stringify(periods, null, 2) });
    return periods.map((period) => mapApiPeriodToModel(period));
  }

  /**
   * Fetch a period by slug.
   * 
   * @returns A Period object if found, otherwise null.
   */
  async getPeriod(slug: string): Promise<Period | null> {
    return new Promise(resolve => {debug({slug}); resolve(null);} );
  }

  /**
   * Fetch all timelines from the API.
   *
   * @returns An array of Timeline objects.
   */
  async getTimelines(): Promise<Timeline[]> {
    return new Promise(resolve => {resolve([]);} );
  }

  /**
   * Fetch a timeline by slug.
   * 
   * @returns A Timeline object if found, otherwise null.
   */
  async getTimeline(slug: string): Promise<Timeline | null> {
    debug({slug});
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

    type TimelineEvents = QueryData<typeof timelineQuery>;

    const { data, error } = await timelineQuery;

    if (error) throw error;

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
    return new Promise(resolve => {resolve([]);} );
  }

  /**
   * Fetch an event by slug.
   * 
   * @returns An event object if found, otherwise null.
   */
  async getEvent(slug: string): Promise<HistoricalEvent | null> {
    return new Promise(resolve => {debug({slug}); resolve(null);} );
  }

};

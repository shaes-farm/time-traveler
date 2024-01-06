import { createClient, type QueryData, type SupabaseClient } from '@supabase/supabase-js'

import type {
  Database,
  HistoricalEvent,
  Period,
  Timeline,
} from '../models';

import {
  mapApiEventToModel,
  mapApiPeriodToModel,
  mapApiTimelineToModel,
} from './mapper';

import type { Fetch } from '../types';

const { debug, error } = console;

export class SupabaseFetch implements Fetch {
  baseUrl: string;
  supabase: SupabaseClient<Database>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Create a single supabase client for interacting with your database
    this.supabase = createClient<Database>(baseUrl, process.env.SUPABASE_ANON_KEY ?? '');
  }

  /**
   * Fetch all periods from the CMS.
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
    type PeriodTimelines = QueryData<typeof periodsQuery>;
    const { data, error } = await periodsQuery;
    if (error) throw error;
    const periods: PeriodTimelines = data;
    debug({ periods: JSON.stringify(periods, null, 2) });
    return periods.map((period) => mapApiPeriodToModel(period)) ?? [];
  }

  /**
   * Fetch a period by slug.
   * 
   * @returns A Period object if found, otherwise null.
   */
  async getPeriod(slug: string): Promise<Period | null> {
    return null;
  }

  /**
   * Fetch all timelines from the CMS.
   *
   * @returns An array of Timeline objects.
   */
  async getTimelines(): Promise<Timeline[]> {
    return [];
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

    return timeline ? mapApiTimelineToModel(timeline) : null;
  }

  /**
   * Fetch all events from the CMS.
   *
   * @returns An array of event objects.
   */
  async getEvents(): Promise<HistoricalEvent[]> {
    return [];
  }

  /**
   * Fetch an event by slug.
   * 
   * @returns An event object if found, otherwise null.
   */
  async getEvent(slug: string): Promise<HistoricalEvent | null> {
    return null;
  }

};

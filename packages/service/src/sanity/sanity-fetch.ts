import fetch from 'isomorphic-fetch';

import type {
  SanityPeriodsResponse,
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

type SanityTimelinesResponse = any;
type SanityEventsResponse = any;

export class SanityFetch implements Fetch {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all periods from the CMS.
   * 
   * @returns An array of Period objects.
   */
  async getPeriods(): Promise<Period[]> {
    const url = new URL(this.baseUrl);

    url.searchParams.set('query', '*[_type == "period"] | order(beginDate, endDate)');

    debug({ url });

    const res = await fetch(url);

    if (!res.ok) {
      error({ res });

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch periods')
    }

    const periods = await res.json() as SanityPeriodsResponse;

    debug({ periods: JSON.stringify(periods, null, 2) });

    return periods.result?.map((period) => mapApiPeriodToModel(period)) ?? [];
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
    const url = new URL(this.baseUrl);
    
    url.searchParams.set('query', '*[_type == "timeline"]');

    debug({ url });

    const res = await fetch(url);

    if (!res.ok) {
      error({ res });

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch timelines')
    }

    const periods = await res.json() as SanityTimelinesResponse;

    debug({ periods: JSON.stringify(periods, null, 2) });

    return periods.data?.map((period) => mapApiTimelineToModel(period.attributes)) ?? [];
  }

  /**
   * Fetch a timeline by slug.
   * 
   * @returns A Timeline object if found, otherwise null.
   */
  async getTimeline(slug: string): Promise<Timeline | null> {
    return null;
  }

  /**
   * Fetch all events from the CMS.
   *
   * @returns An array of event objects.
   */
  async getEvents(): Promise<HistoricalEvent[]> {
    const url = new URL(this.baseUrl);
    
    url.searchParams.set('query', '*[_type == "event"]');

    debug({ url });

    const res = await fetch(url);

    if (!res.ok) {
      error({ res });

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch events')
    }

    const periods = await res.json() as SanityEventsResponse;

    debug({ periods: JSON.stringify(periods, null, 2) });

    return periods.data?.map((period) => mapApiEventToModel(period.attributes)) ?? [];
  }

  /**
   * Fetch a event by slug.
   * 
   * @returns An event object if found, otherwise null.
   */
  async getEvent(slug: string): Promise<HistoricalEvent | null> {
    return null;
  }

};

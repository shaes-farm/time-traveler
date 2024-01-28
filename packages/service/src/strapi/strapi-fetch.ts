import fetch from 'isomorphic-fetch';
import type {
  Category,
  StrapiPeriodsResponse,
  StrapiTimelineResponse,
  HistoricalEvent,
  Media,
  Period,
  Timeline,
} from '../models';
import type { Fetch } from '../types';
import {
  mapApiPeriodToModel,
  mapApiTimelineToModel,
} from './mapper';

const { debug, error } = console;

export class StrapiFetch implements Fetch {
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
    const url = new URL('/api/periods', this.baseUrl);

    url.searchParams.set('populate[timelines][sort][0]', 'beginDate');

    debug({ url });

    const res = await fetch(url);

    if (!res.ok) {
      error({ res });

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch periods')
    }

    const periods = await res.json() as StrapiPeriodsResponse;

    debug({ periods: JSON.stringify(periods, null, 2) });

    return periods.data?.map((period) => mapApiPeriodToModel(period.attributes)) ?? [];
  }

  /**
   * Fetch a period by slug.
   * 
   * @returns A Period object if found, otherwise null.
   */
  async getPeriod(slug: string): Promise<Period | null> {
    const url = new URL('/api/period', this.baseUrl);

    url.searchParams.set('filters[slug][$eq]', slug);
    url.searchParams.set('sort', 'beginDate');

    debug({ url });

    const res = await fetch(url);

    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error(`Failed to fetch period by "${slug}"`);
    }

    const periods = await res.json() as StrapiPeriodsResponse;

    debug({ periods: JSON.stringify(periods, null, 2) });

    return periods.data?.length ? mapApiPeriodToModel(periods.data[0].attributes) : null;
  }

  /**
   * Fetch all timelines from the CMS.
   *
   * @returns An array of Timeline objects.
   */
  async getTimelines(): Promise<Timeline[]> {
    const url = new URL('/api/timelines', this.baseUrl);

    url.searchParams.set('populate[events][sort][0]', 'beginDate');

    debug({ url });

    const res = await fetch(url);

    if (!res.ok) {
      error({ res });

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch timelines')
    }

    const timelines = await res.json() as StrapiTimelineResponse;

    debug({ timelines: JSON.stringify(timelines, null, 2) });

    return timelines.data?.map((timeline) => mapApiTimelineToModel(timeline.attributes)) ?? [];
  }

  /**
   * Fetch a timeline by slug.
   * 
   * @returns A Timeline object if found, otherwise null.
   */
  async getTimeline(slug: string): Promise<Timeline | null> {
    const url = `${this.baseUrl}/api/timelines?filters[slug][$eq]=${slug}&populate[events][sort][0]=eventDate`;
    const res = await fetch(url);

    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch timeline')
    }

    const timeline = await res.json() as StrapiTimelineResponse;
    // console.log({timeline: JSON.stringify(timeline)});

    if (!timeline.data?.length) {
      return null;
    }

    // const events = await this.getEvents();

    return mapApiTimelineToModel(timeline.data[0].attributes);
  }

  async getEvents(): Promise<HistoricalEvent[]> {
    return new Promise(resolve => {resolve([]);});
  }

  async getEvent(slug: string): Promise<HistoricalEvent | null> {
    return new Promise(resolve => {debug({slug}); resolve(null);});
  }

  /**
   * Fetch all categories from the CMS.
   *
   * @returns An array of category objects.
   */
  async getCategories(): Promise<Category[]> {
    return new Promise(resolve => {resolve([]);});
  }

  /**
   * Fetch a category by slug.
   * 
   * @returns An category object if found, otherwise null.
   */
  async getCategory(slug: string):Promise<Category | null> {
    return new Promise(resolve => {debug({slug}); resolve(null);});
  }

  /**
   * Fetch all media from the CMS.
   *
   * @returns An array of media objects.
   */
  async getMedia(): Promise<Media[]> {
    return new Promise(resolve => {resolve([]);});
  }

  /**
   * Fetch a media item by slug.
   * 
   * @returns An media object if found, otherwise null.
   */
  async getMediaItem(slug: string): Promise<Media | null> {
    return new Promise(resolve => {debug({slug}); resolve(null);});
  }
}

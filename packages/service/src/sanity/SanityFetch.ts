import type {
  HistoricalEvent,
  Period,
  Timeline,
} from '../models';

import type { Fetch } from '../types/Fetch';

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
  async getPeriods(): Promise<Period[]> {return [] as Period[];}

  /**
   * Fetch a period by slug.
   * 
   * @returns A Period object if found, otherwise null.
   */
  async getPeriod(slug: string): Promise<Period | null> {return null;}

  /**
   * Fetch all timelines from the CMS.
   *
   * @returns An array of Timeline objects.
   */
  async getTimelines(): Promise<Timeline[]> {return [] as Timeline[];}

  /**
   * Fetch a timeline by slug.
   * 
   * @returns A Timeline object if found, otherwise null.
   */
  async getTimeline(slug: string): Promise<Timeline | null> {return null;}

  /**
   * Fetch all events from the CMS.
   *
   * @returns An array of event objects.
   */
  async getEvents(): Promise<HistoricalEvent[]> {return [] as HistoricalEvent[];}

  /**
   * Fetch a event by slug.
   * 
   * @returns An event object if found, otherwise null.
   */
  async getEvent(slug: string): Promise<HistoricalEvent | null> {return null;}

};

import type {
  HistoricalEvent,
  Period,
  Timeline,
} from '../models';

export interface Fetch {

  /**
   * Fetch all periods from the CMS.
   * 
   * @returns An array of Period objects.
   */
  getPeriods(): Promise<Period[]>;

  /**
   * Fetch a period by slug.
   * 
   * @returns A Period object if found, otherwise null.
   */
  getPeriod(slug: string): Promise<Period | null>;

  /**
   * Fetch all timelines from the CMS.
   *
   * @returns An array of Timeline objects.
   */
  getTimelines(): Promise<Timeline[]>;

  /**
   * Fetch a timeline by slug.
   * 
   * @returns A Timeline object if found, otherwise null.
   */
  getTimeline(slug: string): Promise<Timeline | null>;

  /**
   * Fetch all events from the CMS.
   *
   * @returns An array of event objects.
   */
  getEvents(): Promise<HistoricalEvent[]>;

  /**
   * Fetch a event by slug.
   * 
   * @returns An event object if found, otherwise null.
   */
  getEvent(slug: string): Promise<HistoricalEvent | null>;
}

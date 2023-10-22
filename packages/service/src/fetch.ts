import {
  type StrapiPeriodsResponse,
  type StrapiTimelineResponse,
  type Period,
  type Timeline,
  mapApiPeriodToModel,
  mapApiTimelineToModel,
} from './models';

const {debug, error} = console;

export class Fetch {
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

    debug({url});

    const res = await fetch(url);

    if (!res.ok) {
      error({res});

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch periods')
    }

    const periods = await res.json() as StrapiPeriodsResponse;

    debug({periods: JSON.stringify(periods, null, 2)});

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

    debug({url});

    const res = await fetch(url);

    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error(`Failed to fetch period by "${slug}"`);
    }

    const periods = await res.json() as StrapiPeriodsResponse;

    debug({periods: JSON.stringify(periods, null, 2)});

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

    debug({url});

    const res = await fetch(url);

    if (!res.ok) {
      error({res});

      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch timelines')
    }

    const timelines = await res.json() as StrapiTimelineResponse;

    debug({timelines: JSON.stringify(timelines, null, 2)});

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

  // async getEvents(): Promise<HistoricalEvent[]> {
  //   const res = await fetch(`${this.baseUrl}/api/events?sort=eventDate`);
  //   // The return value is *not* serialized
  //   // You can return Date, Map, Set, etc.

  //   if (!res.ok) {
  //     // This will activate the closest `error.js` Error Boundary
  //     throw new Error('Failed to fetch events')
  //   }

  //   const events = await res.json() as StrapiEventResponse;
  //   // console.log({events: JSON.stringify(events, null, 2)});

  //   if (!events.data?.length) {
  //     return [];
  //   }

  //   return events.data.map((event) => mapEventToModel(event));
  // }

  // async getEvent(slug: string): Promise<HistoricalEvent | null> {
  //   const res = await fetch(`${this.baseUrl}/api/events?filters[slug][$eq]=${slug}&populate=*`);

  //   if (!res.ok) {
  //     // This will activate the closest `error.js` Error Boundary
  //     throw new Error('Failed to fetch event')
  //   }

  //   const event = await res.json() as StrapiEventResponse;
  //   // console.log({event: JSON.stringify(event, null, 2)});

  //   if (!event.data?.length) {
  //     return null;
  //   }

  //   return mapEventToModel(event.data[0]);
  // }

  // async getStrapiEvent(slug: string): Promise<HistoricalEvent | null> {
  //   const res = await fetch(`${this.baseUrl}/api/events?filters[slug][$eq]=${slug}&populate=*`);

  //   if (!res.ok) {
  //     // This will activate the closest `error.js` Error Boundary
  //     throw new Error('Failed to fetch event')
  //   }

  //   log({StrapiEventType: typeof StrapiEventType});

  //   const event: StrapiEventType | null = await res.json() as StrapiEventType | null;

  //   log({strapiEvent: JSON.stringify(event, null, 2)});

  //   return event ? mapStrapiEventToModel(event.data[0].attributes) : null;
  // }
}

import type {Period} from './models/event-model';
import type {StrapiPeriodResponse} from './models/api-model';
import {mapApiPeriodToModel} from './models/mapper';

const {debug, error} = console;

export class Fetch {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

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

    const periodResponse: StrapiPeriodResponse = await res.json() as StrapiPeriodResponse;

    debug({periodResponse: JSON.stringify(periodResponse, null, 2)});

    if (!periodResponse.data?.length) {
      return [];
    }

    return periodResponse.data.map((period) => mapApiPeriodToModel(period.attributes));
  }

  // async getTimelines(): Promise<Timeline[]> {
  //   const url = `${this.baseUrl}/api/timelines?populate[events][sort][0]=eventDate`;
  //   const res = await fetch(url);

  //   if (!res.ok) {
  //     // This will activate the closest `error.js` Error Boundary
  //     throw new Error('Failed to fetch timelines')
  //   }

  //   const timelines = await res.json() as StrapiMultipleTimelineResponse;
  //   // console.log({timelines: JSON.stringify(timelines, null, 2)});

  //   if (!timelines.data?.length) {
  //     return [];
  //   }

  //   return timelines.data.map((timeline) => mapTimelineToModel(timeline));
  // }

  // async getTimeline(slug: string): Promise<Timeline | null> {
  //   const url = `${this.baseUrl}/api/timelines?filters[slug][$eq]=${slug}&populate[events][sort][0]=eventDate`;
  //   const res = await fetch(url);

  //   if (!res.ok) {
  //     // This will activate the closest `error.js` Error Boundary
  //     throw new Error('Failed to fetch timeline')
  //   }

  //   const timeline = await res.json() as StrapiMultipleTimelineResponse;
  //   // console.log({timeline: JSON.stringify(timeline)});

  //   if (!timeline.data?.length) {
  //     return null;
  //   }

  //   // const events = await this.getEvents();
    
  //   return mapTimelineToModel(timeline.data[0]);
  // }

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

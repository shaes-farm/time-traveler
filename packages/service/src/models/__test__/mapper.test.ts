import {faker} from '@faker-js/faker';
import { title } from 'process';
import type {
  StrapiCategory,
  StrapiEvent,
  StrapiPeriod,
  StrapiTimeline,
} from '../api-model';
import type {
  Media,
} from '../app-model';
import * as Mapper from '../mapper';

const STRAPI_TIMELINE: StrapiTimeline = {
  slug: faker.lorem.slug(),
  title: faker.lorem.words({min: 1, max: 8}),
  summary: faker.lorem.paragraph(),
  scale: faker.lorem.words({min: 1, max: 8}),
  beginDate: faker.number.int().toString(),
  endDate: faker.number.int().toString(),
  events: {
    data: []
  },
  periods: {
    data: []
  },
};

const STRAPI_CATEGORY: StrapiCategory = {
  slug: faker.lorem.slug(),
  title: faker.lorem.words({min: 1, max: 8}),
  events: {
    data: [],
  },
};

const STRAPI_MEDIA: Media = {
  alternativeText: faker.lorem.sentence(),
  caption: faker.lorem.sentence(),
  url: faker.image.url(),
  width: faker.number.int(),
  height: faker.number.int(),
  formats: {
    image: 'image/jpeg; image/png; image/gif'
  },
};

const STRAPI_EVENT: StrapiEvent = {
  slug: faker.lorem.slug(),
  title: faker.lorem.words({min: 1, max: 8}),
  summary: faker.lorem.paragraph(),
  detail: '# header\n## markdown\n- list item\n',
  importance: faker.number.int({min: 1, max: 10}) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  location: faker.location.country(),
  beginDate: faker.number.int().toString(),
  endDate: faker.number.int().toString(),
  categories: {
    data: [{
      attributes: STRAPI_CATEGORY,
    }]
  },
  media: {
    data: [{
      attributes: STRAPI_MEDIA
    }],
  },
  timelines: {
    data: [{
      attributes: STRAPI_TIMELINE
    }]
  }
};

const STRAPI_PERIOD: StrapiPeriod = {
  slug: faker.lorem.slug(),
  title: faker.lorem.words({min: 1, max: 8}),
  summary: faker.lorem.paragraph(),
  beginDate: faker.number.int().toString(),
  endDate: faker.number.int().toString(),
  timelines: {
    data: [{
      attributes: STRAPI_TIMELINE
    }]
  }
};

describe('model mappers', () => {
  it('should map from one category to another', () => {
    expect(Mapper.mapApiCategoryToModel(STRAPI_CATEGORY)).toStrictEqual({
      slug: STRAPI_CATEGORY.slug,
      title: STRAPI_CATEGORY.title,
      events: [],
    })
  });
  it('should map from one event to another', () => {
    expect(Mapper.mapApiEventToModel(STRAPI_EVENT)).toStrictEqual({
      slug: STRAPI_EVENT.slug,
      title: STRAPI_EVENT.title,
      summary: STRAPI_EVENT.summary,
      detail: STRAPI_EVENT.detail,
      importance: STRAPI_EVENT.importance,
      location: STRAPI_EVENT.location,
      beginDate: STRAPI_EVENT.beginDate,
      endDate: STRAPI_EVENT.endDate,
      categories: [{
        slug: STRAPI_CATEGORY.slug,
        title: STRAPI_CATEGORY.title,
        events: []
      }],
      media: [STRAPI_MEDIA],
      timelines: [{
        slug: STRAPI_TIMELINE.slug,
        title: STRAPI_TIMELINE.title,
        summary: STRAPI_TIMELINE.summary,
        scale: STRAPI_TIMELINE.scale,
        beginDate: STRAPI_TIMELINE.beginDate,
        endDate: STRAPI_TIMELINE.endDate,
        events: [],
        periods: [],
        }],
    });
  });
  it('should map from one timeline to another', () => {
    expect(Mapper.mapApiTimelineToModel(STRAPI_TIMELINE)).toStrictEqual({
      slug: STRAPI_TIMELINE.slug,
      title: STRAPI_TIMELINE.title,
      summary: STRAPI_TIMELINE.summary,
      scale: STRAPI_TIMELINE.scale,
      beginDate: STRAPI_TIMELINE.beginDate,
      endDate: STRAPI_TIMELINE.endDate,
      events: [],
      periods: [],
    });
  });
  it('should map from one period to another', () => {
    expect(Mapper.mapApiPeriodToModel(STRAPI_PERIOD)).toStrictEqual({
      slug: STRAPI_PERIOD.slug,
      title: STRAPI_PERIOD.title,
      summary: STRAPI_PERIOD.summary,
      beginDate: STRAPI_PERIOD.beginDate,
      endDate: STRAPI_PERIOD.endDate,
      timelines: [{
        slug: STRAPI_TIMELINE.slug,
        title: STRAPI_TIMELINE.title,
        summary: STRAPI_TIMELINE.summary,
        scale: STRAPI_TIMELINE.scale,
        beginDate: STRAPI_TIMELINE.beginDate,
        endDate: STRAPI_TIMELINE.endDate,
        events: [],
        periods: [],
      }],
    });
  });
});

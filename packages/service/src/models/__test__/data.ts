import {faker} from '@faker-js/faker';
import type {
  StrapiCategory,
  StrapiEvent,
  StrapiPeriod,
  StrapiTimeline,
} from '../api-model';
import type {
  Media,
} from '../app-model';

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

export {
  STRAPI_TIMELINE,
  STRAPI_CATEGORY,
  STRAPI_MEDIA,
  STRAPI_EVENT,
  STRAPI_PERIOD,
};

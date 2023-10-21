import * as Mapper from '../mapper';
import {
  STRAPI_TIMELINE,
  STRAPI_CATEGORY,
  STRAPI_MEDIA,
  STRAPI_EVENT,
  STRAPI_PERIOD,
} from './data';

describe('model mapper', () => {

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

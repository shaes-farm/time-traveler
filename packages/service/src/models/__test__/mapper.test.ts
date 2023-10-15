import {faker} from '@faker-js/faker';
import type {StrapiCategory} from '../api-model';
import * as Mapper from '../mapper';

const STRAPI_CATEGORY: StrapiCategory = {
  slug: faker.lorem.slug(),
  title: faker.lorem.words({min: 1, max: 8}),
};

describe('model mappers', () => {
  it('should map from one category to another', () => {
    expect(Mapper.mapApiCategoryToModel(STRAPI_CATEGORY)).toEqual({
      slug: STRAPI_CATEGORY.slug,
      title: STRAPI_CATEGORY.title,
    })
  });
});

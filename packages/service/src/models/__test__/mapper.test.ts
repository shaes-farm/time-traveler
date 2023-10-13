import {faker} from '@faker-js/faker';
import * as Mapper from '../mapper';

const STRAPI_CATEGORY = {
  data: [{
    attributes: {
      slug: faker.lorem.slug(),
      title: faker.lorem.words({min: 1, max: 8}),
    }
  }]
};

describe('model mappers', () => {
  it('should map from one thing to another', () => {
    expect(Mapper.mapApiCategoryToModel(STRAPI_CATEGORY)).toEqual({
      slug: expect.any(String),
      title: expect.any(String),
    })
  });
});

import 'jest-extended';
import '@testing-library/jest-dom';
import type {Faker} from '@faker-js/faker';
import {faker} from '@faker-js/faker';

global.faker = faker;

declare global {
    // eslint-disable-next-line no-var -- unit test helper
    var faker: Faker;
}

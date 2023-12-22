import type { Fetch } from './types';
import { SanityFetch } from './sanity';
import { StrapiFetch } from './strapi';

export type Backend = 'sanity' | 'strapi';

export class FetchFactory {
    static create(backend: Backend, baseUrl: string): Fetch {
        if (backend === 'strapi') {
            return new StrapiFetch(baseUrl);
        } else if (backend === 'sanity') {
            return new SanityFetch(baseUrl);
        }

        throw new Error(`Unsupported fetch backend ${backend}`);
    }
}

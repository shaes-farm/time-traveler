import type { Fetch } from './types';
import { SanityFetch } from './sanity';
import { StrapiFetch } from './strapi';
import { SupabaseFetch } from './supabase';

export type Backend = 'sanity' | 'strapi' | 'supabase';

export class FetchFactory {
    static create(backend: Backend, baseUrl: string, token?: string): Fetch {
        if (backend === 'strapi') {
            return new StrapiFetch(baseUrl);
        } else if (backend === 'sanity') {
            return new SanityFetch(baseUrl);
        } else if (backend == 'supabase') {
            return new SupabaseFetch(baseUrl, token ?? '');
        }

        throw new Error(`Unsupported fetch backend ${backend}`);
    }
}

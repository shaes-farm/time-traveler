import type { Fetch } from './types';
import { SanityFetch } from './sanity';
import { StrapiFetch } from './strapi';
import { SupabaseFetch } from './supabase';

export type Backend = 'sanity' | 'strapi' | 'supabase';

export const fetchFactory = (backend: Backend, baseUrl: string): Fetch => {
    switch (backend) {
        case 'strapi':
            return new StrapiFetch(baseUrl);
        case 'sanity':
            return new SanityFetch(baseUrl);
        case 'supabase':
            return new SupabaseFetch(baseUrl);
        default: break;
    }

    throw new Error('Unsupported fetch backend');
};

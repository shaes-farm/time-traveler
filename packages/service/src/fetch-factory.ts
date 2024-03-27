import type { Fetch } from './types';
import { SupabaseFetch } from './supabase';

export type Backend = 'strapi' | 'supabase';

export const fetchFactory = (backend: Backend, baseUrl: string): Fetch => {
    switch (backend) {
        case 'supabase':
            return new SupabaseFetch(baseUrl);
        default: break;
    }

    throw new Error('Unsupported fetch backend');
};

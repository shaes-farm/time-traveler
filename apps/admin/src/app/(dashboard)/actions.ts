'use server';

import debugFactory from 'debug';
import { cookies } from 'next/headers';
import { mapApiProfileToModel } from 'service';
import type { Profile, PostgrestProfile } from 'service';
import { createClient } from '../../utils/supabase/server';

const debug = debugFactory('admin:actions');

export async function queryUserProfile(id: string): Promise<Profile | null> {
    const supabase = createClient(cookies());

    debug('queryUserProfile', { id });

    const { error, data } = await supabase
        .from('profiles')
        .select()
        .eq('id', id)
        .maybeSingle();

    debug('queryUserProfile', { error, data });

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    const profile = data as PostgrestProfile | null;

    return profile ? mapApiProfileToModel(profile) : null;
}
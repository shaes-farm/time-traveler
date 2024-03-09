'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation';
import { mapApiProfileToModel } from 'service';
import type { Profile, PostgrestProfile } from 'service';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:profile:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryById(id: string): Promise<Profile | null> {
    const supabase = createClient(cookies());

    debug('queryById', { id });

    const { error, data } = await supabase
        .from('profiles')
        .select()
        .eq('id', id)
        .maybeSingle();

    debug('queryById', { error, data });

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    const profile = data as PostgrestProfile | null;

    return profile ? mapApiProfileToModel(profile) : null;
}

export async function update(profile: Profile): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', {profile});

    const { error, data } = await supabase
        .from('profiles')
        .update({
            // id: session.user.id,
            first_name: profile.firstName,
            last_name: profile.lastName,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            website: profile.website,
            updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

    debug('update', {error, data});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/profile`, 'layout');
    redirect(`${appBaseUrl}${basePath}/profile`);
}

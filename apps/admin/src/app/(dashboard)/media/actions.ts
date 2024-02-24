'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiMediaToModel } from 'service';
import type { Media, PostgrestMedia } from 'service';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:media:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryAll(): Promise<Media[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('user.id', session.user.id);

    const { error, data } = await supabase
        .from('media')
        .select()
        .eq('user_id', session.user.id)
        .order('alternativetext');

    debug('queryAll', { error, data });

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    const mediaList = data as PostgrestMedia[] | null;

    debug('queryAll', { media: mediaList });

    return mediaList ? mediaList.map((media) => mapApiMediaToModel(media)) : [];
}

export async function queryBySlug(slug: string): Promise<Media | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    const { error, data } = await supabase
        .from('media')
        .select()
        .eq('user_id', session.user.id)
        .eq('slug', slug)
        .maybeSingle();

    debug('query', { error, data });

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    const media = data as PostgrestMedia | null;

    return media ? mapApiMediaToModel(media) : null;
}

export async function insert(media: Media): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', { media });

    const { error } = await supabase
        .from('media')
        .insert({
            user_id: session.user.id,
            slug: media.slug,
            alternativetext: media.alternativeText,
            caption: media.caption ? media.caption : null,
            url: media.url,
            width: media.width,
            height: media.height,
            formats: media.formats,
        });

    debug('insert', { error });

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/media`, 'layout');
    redirect(`${appBaseUrl}${basePath}/media`);
}

export async function update(media: Media): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', { media });

    const { error, data } = await supabase
        .from('media')
        .update({
            user_id: session.user.id,
            slug: media.slug,
            alternativetext: media.alternativeText,
            caption: media.caption ? media.caption : null,
            url: media.url,
            width: media.width,
            height: media.height,
            formats: media.formats,
        })
        .eq('user_id', session.user.id)
        .eq('slug', media.slug);

    debug('update', { error, data });

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/media`, 'layout');
    redirect(`${appBaseUrl}${basePath}/media`);
}

export async function remove(slug: string): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('remove', { slug });

    const { error } = await supabase
        .from('media')
        .delete()
        .eq('user_id', session.user.id)
        .eq('slug', slug);

    if (error) {
        debug({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/media`, 'layout');
    redirect(`${appBaseUrl}${basePath}/media`);
}

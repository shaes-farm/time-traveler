'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiTimelineToModel } from 'service';
import type { Timeline, PostgrestTimeline } from 'service';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:timelines:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryAll(): Promise<Timeline[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('user.id', session.user.id);

    const { error, data } = await supabase
        .from('timelines')
        .select()
        .eq('user_id', session.user.id)
        .order('begin_date, end_date');

    debug('queryAll', {error, data});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    const timelines = data as PostgrestTimeline[] | null;

    debug('queryAll', {timelines});

    return timelines ? timelines.map((timeline) => mapApiTimelineToModel(timeline)) : [];
}

export async function queryBySlug(slug: string): Promise<Timeline | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    const { error, data } = await supabase
        .from('timelines')
        .select()
        .eq('slug', slug)
        .maybeSingle();

    debug('query', {error, data});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    const timeline = data as PostgrestTimeline | null;

    return timeline ? mapApiTimelineToModel(timeline) : null;
}

export async function insert(timeline: Timeline): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', {timeline});

    const { error } = await supabase
        .from('timelines')
        .insert({
            user_id: session.user.id,
            slug: timeline.slug,
            title: timeline.title,
            summary: timeline.summary,
            begin_date: timeline.beginDate,
            end_date: timeline.endDate,
        });

    debug('insert', {error});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/timelines`, 'layout');
    redirect(`${appBaseUrl}${basePath}/timelines`);
}

export async function update(timeline: Timeline): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', {timeline});

    const { error, data } = await supabase
        .from('timelines')
        .update({
            user_id: session.user.id,
            slug: timeline.slug,
            title: timeline.title,
            summary: timeline.summary ?? undefined,
            begin_date: timeline.beginDate,
            end_date: timeline.endDate,
        })
        .eq('slug', timeline.slug);

    debug('update', {error, data});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/timelines`, 'layout');
    redirect(`${appBaseUrl}${basePath}/timelines`);
}

export async function remove(slug: string): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('remove', {slug});

    const { error } = await supabase
        .from('timelines')
        .delete()
        .eq('slug', slug);

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/timelines`, 'layout');
    redirect(`${appBaseUrl}${basePath}/timelines`);
}

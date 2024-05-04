/* eslint-disable @typescript-eslint/ban-ts-comment -- Forgive Supabase's Typescript errors */
'use server';

import debugFactory from 'debug';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiTimelineToModel } from 'service';
import type { Timeline, PostgrestTimeline } from 'service';
import { createClient } from '../../../utils/supabase/server';
import { logger } from '../../../utils/logger';
import { getAppConfig } from '../../../utils/config';

const debug = debugFactory('admin:timelines:actions');

const {
    baseUrl: appBaseUrl,
    basePath,
} = getAppConfig();

export async function queryAll(): Promise<Timeline[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryAll', { user: session.user });

    const { error, data } = await supabase
        .from('timelines')
        .select()
        .eq('user_id', session.user.id)
        .order('begin_date, end_date');

    debug('queryAll', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const timelines = data as PostgrestTimeline[] | null;

    debug('queryAll', { timelines });

    return timelines ? timelines.map((timeline) => mapApiTimelineToModel(timeline)) : [];
}

export async function queryBySlug(slug: string): Promise<Timeline | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryBySlug', { slug, user: session.user });

    const { error, data } = await supabase
        .from('timelines')
        .select(`
            slug,
            title,
            summary,
            detail,
            scale,
            begin_date,
            end_date,
            published,
            publishedAt
            historical_events!timeline_events (
                slug,
                title,
                begin_date,
                end_date
            )
        `)
        .match({
            slug,
            user_id: session.user.id,
        })
        .maybeSingle();

    debug('queryBySlug', { error, data });

    if (error) {
        logger.error({ error });
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

    debug('insert', { timeline, user: session.user });

    const { data, error } = await supabase.rpc('create_timeline', {
        timeline: {
            user_id: session.user.id,
            slug: timeline.slug,
            title: timeline.title,
            // @ts-expect-error
            summary: timeline.summary,
            // @ts-expect-error
            detail: timeline.detail,
            // @ts-expect-error
            scale: timeline.scale,
            begin_date: timeline.beginDate,
            end_date: timeline.endDate,
            historical_events: timeline.events.map((event) => event.slug),
        }
    });

    debug('insert', { data, error });

    if (error) {
        logger.error({ error });
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

    debug('update', { timeline });

    const { error, data } = await supabase.rpc('update_timeline', {
        timeline: {
            user_id: session.user.id,
            slug: timeline.slug,
            title: timeline.title,
            // @ts-expect-error
            summary: timeline.summary ?? undefined,
            // @ts-expect-error
            detail: timeline.detail ?? undefined,
            // @ts-expect-error
            scale: timeline.scale,
            begin_date: timeline.beginDate,
            end_date: timeline.endDate,
            historical_events: timeline.events.map((event) => event.slug),
        }
    });

    debug('update', { error, data });

    if (error) {
        logger.error({ error });
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

    debug('remove', { slug, user: session.user });

    const { error, data } = await supabase.rpc('delete_timeline', {
        // @ts-expect-error
        timeline: {
            slug,
            user_id: session.user.id,
        }
    });

    debug('remove', { error, data });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/timelines`, 'layout');
    redirect(`${appBaseUrl}${basePath}/timelines`);
}

export async function publish(slug: string, published: boolean): Promise<boolean> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('publish', { published, slug, user: session.user });

    const { error, data } = await supabase.rpc('publish_timeline', {
        user_id: session.user.id,
        slug,
        published
    });

    debug('publish', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    return data;
}

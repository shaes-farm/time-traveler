/* eslint-disable @typescript-eslint/ban-ts-comment -- Forgive Supabase's Typescript errors */
'use server';

import debugFactory from 'debug';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiEventToModel } from 'service';
import type { HistoricalEvent, PostgrestHistoricalEvent } from 'service';
import { createClient } from '../../../utils/supabase/server';
import { logger } from '../../../utils/logger';
import { getAppConfig } from '../../../utils/config';

const debug = debugFactory('admin:events:actions');

const {
    baseUrl: appBaseUrl,
    basePath,
} = getAppConfig();

export async function queryAll(): Promise<HistoricalEvent[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryAll', { user: session.user });

    const { error, data } = await supabase
        .from('historical_events')
        .select()
        .eq('user_id', session.user.id)
        .order('begin_date');

    debug('queryAll', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const events = data as PostgrestHistoricalEvent[] | null;

    debug('queryAll', { events });

    return events ? events.map((event) => mapApiEventToModel(event)) : [];
}

export async function queryBySlug(slug: string): Promise<HistoricalEvent | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryBySlug', { slug, user: session.user });

    const { error, data } = await supabase
        .from('historical_events')
        .select(`
            slug,
            title,
            summary,
            detail,
            location,
            importance,
            begin_date,
            end_date,
            published,
            publishedAt
            timelines!timeline_events (
                slug,
                title,
                begin_date,
                end_date
            ),
            media!event_media (
                slug,
                alternativetext,
                caption
            ),
            categories!event_categories (
                slug,
                title
            )
        `)
        .match({
            user_id: session.user.id,
            slug,
        })
        .maybeSingle();

    debug('query', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const event = data as PostgrestHistoricalEvent | null;

    return event ? mapApiEventToModel(event) : null;
}

export async function insert(event: HistoricalEvent): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', { event, user: session.user });

    const { error, data } = await supabase.rpc('create_event', {
        event: {
            user_id: session.user.id,
            slug: event.slug,
            title: event.title,
            // @ts-expect-error
            summary: event.summary,
            // @ts-expect-error
            detail: event.detail,
            // @ts-expect-error
            location: event.location,
            importance: event.importance,
            begin_date: event.beginDate,
            // @ts-expect-error
            end_date: event.endDate,
            media: event.media.map((media) => media.slug),
        }
    });

    debug('insert', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/events`, 'layout');
    redirect(`${appBaseUrl}${basePath}/events`);
}

export async function update(event: HistoricalEvent): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', { event, user: session.user });

    const { error, data } = await supabase.rpc('update_event', {
        event: {
            user_id: session.user.id,
            slug: event.slug,
            title: event.title,
            // @ts-expect-error
            summary: event.summary,
            // @ts-expect-error
            detail: event.detail,
            // @ts-expect-error
            location: event.location,
            importance: event.importance,
            begin_date: event.beginDate,
            // @ts-expect-error
            end_date: event.endDate,
            media: event.media.map((media) => media.slug),
        }
    });

    debug('update', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/events`, 'layout');
    redirect(`${appBaseUrl}${basePath}/events`);
}

export async function remove(slug: string): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('remove', { slug });

    const { error, data } = await supabase.rpc('delete_event', {
        // @ts-expect-error
        event: {
            user_id: session.user.id,
            slug,
        }
    });

    debug('remove', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/events`, 'layout');
    redirect(`${appBaseUrl}${basePath}/events`);
}

export async function publish(slug: string, published: boolean): Promise<boolean> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('publish', { published, slug, user: session.user });

    const { error, data } = await supabase.rpc('publish_event', {
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

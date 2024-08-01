/* eslint-disable @typescript-eslint/ban-ts-comment -- Forgive Supabase's Typescript errors */
'use server';

import debugFactory from 'debug';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiPeriodToModel } from 'service';
import type { Period, PostgrestPeriod } from 'service';
import { createClient } from '../../../utils/supabase/server';
import { logger } from '../../../utils/logger';
import { getAppConfig } from '../../../utils/config';

const debug = debugFactory('admin:periods:actions');

const {
    baseUrl: appBaseUrl,
    basePath,
} = getAppConfig();

export async function queryAll(): Promise<Period[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryAll', { user: session.user });

    const { error, data } = await supabase
        .from('periods')
        .select()
        .eq('user_id', session.user.id)
        .order('begin_date');

    debug('queryAll', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const periods = data as PostgrestPeriod[] | null;

    debug('queryAll', { periods });

    return periods ? periods.map((period) => mapApiPeriodToModel(period)) : [];
}

export async function queryBySlug(slug: string): Promise<Period | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryBySlug', { slug, user: session.user });

    const { error, data } = await supabase
        .from('periods')
        .select(`
            slug,
            title,
            summary,
            detail,
            begin_date,
            end_date,
            published,
            published_at,
            timelines!period_timelines (
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

    const period = data as PostgrestPeriod | null;

    return period ? mapApiPeriodToModel(period) : null;
}

export async function insert(period: Period): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', { period });

    const { error, data } = await supabase.rpc('create_period', {
        period: {
            user_id: session.user.id,
            slug: period.slug,
            title: period.title,
            // @ts-expect-error
            summary: period.summary,
            // @ts-expect-error
            detail: period.detail,
            begin_date: period.beginDate,
            end_date: period.endDate,
            timelines: period.timelines.map((timeline) => timeline.slug),
        }
    });

    debug('insert', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/periods`, 'layout');
    redirect(`${appBaseUrl}${basePath}/periods`);
}

export async function update(period: Period): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', { period });

    const { error, data } = await supabase.rpc('update_period', {
        period: {
            user_id: session.user.id,
            slug: period.slug,
            title: period.title,
            // @ts-expect-error
            summary: period.summary ?? undefined,
            // @ts-expect-error
            detail: period.detail ?? undefined,
            begin_date: period.beginDate,
            end_date: period.endDate,
            timelines: period.timelines.map((timeline) => timeline.slug),
        }
    });

    debug('update', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/periods`, 'layout');
    redirect(`${appBaseUrl}${basePath}/periods`);
}

export async function remove(slug: string): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('remove', { slug });

    const { error, data } = await supabase.rpc('delete_period', {
        // @ts-expect-error
        period: {
            slug,
            user_id: session.user.id,
        }
    });

    debug('remove', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/periods`, 'layout');
    redirect(`${appBaseUrl}${basePath}/periods`);
}

export async function publish(slug: string, published: boolean): Promise<boolean> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('publish', { published, slug, user: session.user });

    const { error, data } = await supabase.rpc('publish_period', {
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

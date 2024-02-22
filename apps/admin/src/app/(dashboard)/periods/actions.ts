'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiPeriodToModel } from 'service';
import type { Period, PostgrestPeriod } from 'service';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:periods:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryAll(): Promise<Period[]> {
    const supabase = createClient(cookies());
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('user.id', session.user.id);

    const { error, data } = await supabase
        .from('periods')
        .select()
        .eq('user_id', session.user.id)
        .order('begin_date');

    debug('queryAll', {error, data});

    if (error) {
        debug({error});
        throw error;
    }

    const periods = data as PostgrestPeriod[] | null;

    debug('queryAll', {periods});

    return periods ? periods.map((period) => mapApiPeriodToModel(period)) : [];
}

export async function queryBySlug(slug: string): Promise<Period | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    const { error, data } = await supabase
        .from('periods')
        .select()
        .eq('slug', slug);

    debug('query', {error, data});

    if (error) {
        debug({error});
        throw error;
    }

    const period = data[0] as PostgrestPeriod | null;

    return period ? mapApiPeriodToModel(period) : null;
}

export async function insert(period: Period): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', {period});

    const { error } = await supabase
        .from('periods')
        .insert({
            user_id: session.user.id,
            slug: period.slug,
            title: period.title,
            summary: period.summary,
            begin_date: period.beginDate,
            end_date: period.endDate,
        });

    debug('insert', {error});

    if (error) {
        debug({error});
        throw error;
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

    debug('update', {period});

    const { error, data } = await supabase
        .from('periods')
        .update({
            user_id: session.user.id,
            slug: period.slug,
            title: period.title,
            summary: period.summary ?? undefined,
            begin_date: period.beginDate,
            end_date: period.endDate,
        })
        .eq('slug', period.slug);

    debug('update', {error, data});

    if (error) {
        debug({error});
        throw error;
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

    debug('remove', {slug});

    const { error } = await supabase
        .from('periods')
        .delete()
        .eq('slug', slug);

    if (error) {
        debug({error});
        throw error;
    }

    revalidatePath(`${appBaseUrl}${basePath}/periods`, 'layout');
    redirect(`${appBaseUrl}${basePath}/periods`);
}

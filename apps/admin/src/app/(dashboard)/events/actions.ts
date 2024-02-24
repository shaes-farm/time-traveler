'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiEventToModel } from 'service';
import type { HistoricalEvent, PostgrestHistoricalEvent } from 'service';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:events:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryAll(): Promise<HistoricalEvent[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('user.id', session.user.id);

    const { error, data } = await supabase
        .from('historical_events')
        .select()
        .eq('user_id', session.user.id)
        .order('begin_date');

    debug('queryAll', {error, data});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    const events = data as PostgrestHistoricalEvent[] | null;

    debug('queryAll', {events});

    return events ? events.map((event) => mapApiEventToModel(event)) : [];
}

export async function queryBySlug(slug: string): Promise<HistoricalEvent | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    const { error, data } = await supabase
        .from('historical_events')
        .select()
        .eq('slug', slug)
        .maybeSingle();

    debug('query', {error, data});

    if (error) {
        debug({error});
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

    debug('insert', {event});

    const { error } = await supabase
        .from('historical_events')
        .insert({
            user_id: session.user.id,
            slug: event.slug,
            title: event.title,
            summary: event.summary ? event.summary : null,
            detail: event.detail ? event.detail : null,
            location: event.location ? event.location : null,
            importance: event.importance,
            begin_date: event.beginDate,
            end_date: event.endDate ? event.endDate : null,
        });
      
    debug('insert', {error});

    if (error) {
        debug({error});
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

    debug('update', {event});

    const { error, data } = await supabase
        .from('historical_events')
        .update({
            user_id: session.user.id,
            slug: event.slug,
            title: event.title,
            summary: event.summary ? event.summary : null,
            detail: event.detail ? event.detail : null,
            location: event.location ? event.location : null,
            importance: event.importance,
            begin_date: event.beginDate,
            end_date: event.endDate ? event.endDate : null,
        })
        .eq('slug', event.slug);

    debug('update', {error, data});

    if (error) {
        debug({error});
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

    debug('remove', {slug});

    const { error } = await supabase
        .from('historical_events')
        .delete()
        .eq('slug', slug);

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/events`, 'layout');
    redirect(`${appBaseUrl}${basePath}/events`);
}

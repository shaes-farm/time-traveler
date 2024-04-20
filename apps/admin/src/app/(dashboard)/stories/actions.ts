/* eslint-disable @typescript-eslint/ban-ts-comment -- Forgive Supabase's Typescript errors */
'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiStoryToModel } from 'service';
import type { Story, PostgrestStory } from 'service';
import { createClient } from '../../../utils/supabase/server';
import { logger } from '../../../utils/logger';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:stories:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryAll(): Promise<Story[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryAll', { user: session.user });

    const { error, data } = await supabase
        .from('stories')
        .select()
        .eq('user_id', session.user.id)
        .order('title');

    debug('queryAll', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const stories = data as PostgrestStory[] | null;

    debug('queryAll', { stories });

    return stories ? stories.map((story) => mapApiStoryToModel(story)) : [];
}

export async function queryBySlug(slug: string): Promise<Story | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryBySlug', {slug, user: session.user });

    const { error, data } = await supabase
        .from('stories')
        .select(`
            slug,
            title,
            sub_title,
            summary,
            detail,
            periods!story_periods (
                slug,
                title,
                begin_date,
                end_date
            )
        `)
        .match({
            user_id: session.user.id,
            slug,
        })
        .maybeSingle();

    debug('queryBySlug', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const story = data as PostgrestStory | null;

    return story ? mapApiStoryToModel(story) : null;
}

export async function insert(story: Story): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', { story, user: session.user });

    const { error, data } = await supabase.rpc('create_story', {
        story: {
            user_id: session.user.id,
            slug: story.slug,
            title: story.title,
            // @ts-expect-error
            sub_title: story.subTitle,
            // @ts-expect-error
            summary: story.summary,
            // @ts-expect-error
            detail: story.detail,
            periods: story.periods.map((period) => period.slug),
        }
    });

    debug('insert', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/stories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/stories`);
}

export async function update(story: Story): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', { story, user: session.user });

    const { error, data } = await supabase.rpc('update_story', {
        story: {
            user_id: session.user.id,
            slug: story.slug,
            title: story.title,
            // @ts-expect-error
            sub_title: story.subTitle,
            // @ts-expect-error
            summary: story.summary,
            // @ts-expect-error
            detail: story.detail,
            periods: story.periods.map((period) => period.slug),
        }
    });

    debug('update', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/stories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/stories`);
}

export async function remove(slug: string): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('remove', { slug, user: session.user });

    const { error, data } = await supabase.rpc('delete_story', {
        // @ts-expect-error
        story: {
            user_id: session.user.id,
            slug,
        }
    });

    debug('remove', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/stories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/stories`);
}

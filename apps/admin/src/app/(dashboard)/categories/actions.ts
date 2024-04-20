/* eslint-disable @typescript-eslint/ban-ts-comment -- Forgive Supabase's Typescript errors */
'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiCategoryToModel } from 'service';
import type { Category, PostgrestCategory } from 'service';
import { createClient } from '../../../utils/supabase/server';
import { logger } from '../../../utils/logger';
import type { NextConfig } from '../../../types';

const debug = debugFactory('admin:categories:actions');

const {
    publicRuntimeConfig: {
        app: {
            baseUrl: appBaseUrl,
            basePath,
        }
    },
} = getConfig() as NextConfig;

export async function queryAll(): Promise<Category[]> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryAll', { user: session.user });

    const { error, data } = await supabase
        .from('categories')
        .select()
        .eq('user_id', session.user.id)
        .order('title');

    debug('queryAll', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const categories = data as PostgrestCategory[] | null;

    debug('queryAll', { categories });

    return categories ? categories.map((category) => mapApiCategoryToModel(category)) : [];
}

export async function queryBySlug(slug: string): Promise<Category | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('queryBySlug', { slug, user: session.user });

    const { error, data } = await supabase
        .from('categories')
        .select(`
            slug,
            title,
            historical_events!event_categories (
                slug,
                title,
                begin_date,
                end_date
            )
        `)
        .eq('user_id', session.user.id)
        .eq('slug', slug)
        .maybeSingle();

    debug('queryBySlug', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    const category = data as PostgrestCategory | null;

    return category ? mapApiCategoryToModel(category) : null;
}

export async function insert(category: Category): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('insert', { category, user: session.user });

    const { error, data } = await supabase.rpc('create_category', {
        category: {
            user_id: session.user.id,
            slug: category.slug,
            title: category.title,
            historical_events: category.events.map((event) => event.slug),
        }
    });

    debug('insert', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/categories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/categories`);
}

export async function update(category: Category): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('update', { category, user: session.user });

    const { error, data } = await supabase.rpc('update_category', {
        category: {
            user_id: session.user.id,
            slug: category.slug,
            title: category.title,
            historical_events: category.events.map((event) => event.slug),
        }
    });

    debug('update', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/categories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/categories`);
}

export async function remove(slug: string): Promise<void> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    debug('remove', { slug, user: session.user });

    const { error, data } = await supabase.rpc('delete_category', {
        // @ts-expect-error
        category: {
            user_id: session.user.id,
            slug,
        }
    });

    debug('remove', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/categories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/categories`);
}

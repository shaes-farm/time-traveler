'use server';

import debugFactory from 'debug';
import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mapApiCategoryToModel } from 'service';
import type { Category, PostgrestCategory } from 'service';
import { createClient } from '../../../utils/supabase/server';
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

    debug('user.id', session.user.id);

    const { error, data } = await supabase
        .from('categories')
        .select()
        .eq('user_id', session.user.id)
        .order('title');

    debug('queryAll', {error, data});

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    const categories = data as PostgrestCategory[] | null;

    debug('queryAll', {categories});

    return categories ? categories.map((category) => mapApiCategoryToModel(category)) : [];
}

export async function queryBySlug(slug: string): Promise<Category | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    const { error, data } = await supabase
        .from('categories')
        .select()
        .eq('user_id', session.user.id)
        .eq('slug', slug)
        .maybeSingle();

    debug('query', {error, data});

    if (error) {
        debug({error});
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

    debug('insert', {category});

    const { error } = await supabase
        .from('categories')
        .insert({
            user_id: session.user.id,
            slug: category.slug,
            title: category.title,
        });

    debug('insert', {error});

    if (error) {
        debug({error});
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

    debug('update', {category});

    const { error, data } = await supabase
        .from('categories')
        .update({
            user_id: session.user.id,
            slug: category.slug,
            title: category.title,
        })
        .eq('user_id', session.user.id)
        .eq('slug', category.slug);

    debug('update', {error, data});

    if (error) {
        debug({error});
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

    debug('remove', {slug});

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', session.user.id)
        .eq('slug', slug);

    if (error) {
        debug({error});
        throw new Error(error.message);
    }

    revalidatePath(`${appBaseUrl}${basePath}/categories`, 'layout');
    redirect(`${appBaseUrl}${basePath}/categories`);
}

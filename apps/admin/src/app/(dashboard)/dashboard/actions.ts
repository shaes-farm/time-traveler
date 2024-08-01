'use server';

import debugFactory from 'debug';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from 'service';
import { createClient } from '../../../utils/supabase/server';
import { getAppConfig } from '../../../utils/config';
import { logger } from '../../../utils/logger';

const debug = debugFactory('admin:dashboard:actions');

interface Metrics {
    storyCount: number;
    periodCount: number;
    timelineCount: number;
    eventCount: number;
    categoryCount: number;
    mediaCount: number;
}

type PostgrestMetrics = Database["public"]["CompositeTypes"]["metrics"];

const mapToMetrics = ({
    story_count: storyCount,
    period_count: periodCount,
    timeline_count: timelineCount,
    event_count: eventCount,
    category_count: categoryCount,
    media_count: mediaCount,
}: PostgrestMetrics): Metrics => ({
    storyCount,
    periodCount,
    timelineCount,
    eventCount,
    categoryCount,
    mediaCount,
});

const {
    baseUrl: appBaseUrl,
    basePath,
} = getAppConfig();

export async function getMetrics(): Promise<Metrics | null> {
    const supabase = createClient(cookies());

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(`${appBaseUrl}${basePath}/signin`);
    }

    const { error, data } = await supabase.rpc('get_metrics', {
        u: {
            id: session.user.id
        }
    });

    debug('getMetrics', { error, data });

    if (error) {
        logger.error({ error });
        throw new Error(error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it can be null, cope
    return data ? mapToMetrics(data) : null;
}

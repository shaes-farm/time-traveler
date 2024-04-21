'use server';

import debugFactory from 'debug';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'
import type { Media } from 'service';
import { createClient } from '../../../../utils/supabase/server';
import { getAppConfig } from '../../../../utils/config';

const debug = debugFactory('admin:media:create:actions');

const {
  baseUrl: appBaseUrl,
  basePath,
} = getAppConfig();

export async function addMedia(media: Media): Promise<void> {
  const supabase = createClient(cookies());

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  debug('addMedia', { media });

  const { data: items, error: lookupError } = await supabase
    .from('media')
    .select()
    .eq('slug', media.slug);

  debug('addMedia', { lookupError, items });

  if (!lookupError && items.length > 0) {
    const db = {
      user_id: session.user.id,
      slug: media.slug,
      url: media.url,
      formats: media.formats,
    };

    debug('addMedia->update', { db });

    const { error } = await supabase
      .from('media')
      .update(db)
      .eq('slug', media.slug);

    if (error) {
      debug({ error });
      throw new Error(error.message);
    }
  } else {
    const db = {
      user_id: session.user.id,
      slug: media.slug,
      alternativetext: media.alternativeText,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      formats: media.formats,
    };

    debug('addMedia->insert', { db });

    const { error } = await supabase
      .from('media')
      .insert(db);

    if (error) {
      debug({ error });
      throw new Error(error.message);
    }
  }

  revalidatePath(`${appBaseUrl}${basePath}/media`, 'page');
}

import debugFactory from 'debug';
import { redirect } from 'next/navigation';
import type { FileUpload } from 'ui';
import { SupabaseUpload, type Media, type UploadInfo } from 'service';
import { createClient } from '../../../../utils/supabase/client';

const debug = debugFactory('admin:media:create:actions');

export async function upload(fileUpload: FileUpload, setProgress: (percentage: number) => void, onSuccess: (info: UploadInfo) => void, onError: (error: Error) => void): Promise<void> {
  const supabase = createClient();

  const supa = new SupabaseUpload(supabase);

  const onReset = (info: UploadInfo): void => {
    fileUpload.progress = 100;
    onSuccess(info);
  };

  await supa.resumableUpload(
    'media',
    fileUpload.file,
    setProgress,
    onReset,
    onError,
  );
}

export async function addMedia(media: Media): Promise<void> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/signin');
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
}

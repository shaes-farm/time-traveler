import debugFactory from 'debug';
import type { FileUpload } from 'ui';
import { SupabaseUpload, type Media, type UploadInfo } from 'service';
import { createClient } from '../../utils/supabase/client';

const debug = debugFactory('admin:dashboard:actions');

export async function upload(bucketName: string, fileUpload: FileUpload, setProgress: (percentage: number) => void, onSuccess: (info: UploadInfo) => void, onError: (error: Error) => void): Promise<void> {
  const supabase = createClient();

  const supa = new SupabaseUpload(supabase);

  const onReset = (info: UploadInfo): void => {
    fileUpload.progress = 100;
    onSuccess(info);
  };

  await supa.resumableUpload(
    bucketName,
    fileUpload.file,
    setProgress,
    onReset,
    onError,
  );
}

export async function addMedia(media: Media): Promise<void> {
  const supabase = createClient();

  debug('addMedia', {media});

  const { data: items, error: lookupError } = await supabase
    .from('media')
    .select()
    .eq('slug', media.slug);

  debug('addMedia', {lookupError, items});

  if (!lookupError && items.length > 0) {
    const db = {
      user_id: media.userId,
      slug: media.slug,
      url: media.url,
      formats: media.formats,
    };
    debug('addMedia->update', {db});
    await supabase
      .from('media')
      .update(db)
      .eq('slug', media.slug);
  } else {
    const db = {
      user_id: media.userId,
      slug: media.slug,
      alternativetext: media.alternativeText,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      formats: media.formats,
    };
    debug('addMedia->insert', {db});
    await supabase
      .from('media')
      .insert(db);
  }
}

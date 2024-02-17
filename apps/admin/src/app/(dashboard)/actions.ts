import debugFactory from 'debug';
import slugify from 'slugify';
import * as tus from 'tus-js-client';
import type { FileUpload } from 'ui';
import type { Media } from 'service';
import { createClient } from '../../utils/supabase/client'

const debug = debugFactory('admin:dashboard:actions');

export async function upload(bucketName: string, fileUpload: FileUpload, setProgress: (percentage: number) => void, onError: (error: Error) => void): Promise<void> {
  const { file } = fileUpload;
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  debug(`Uploading file ${file.name} to ${bucketName}`);

  const uploadFile = new tus.Upload(file, {
    endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      'authorization': `Bearer ${session?.access_token}`,
      'x-upsert': 'true', // optionally set upsert to true to overwrite existing files
    },
    uploadDataDuringCreation: true,
    // Important if you want to allow re-uploading the same file
    // https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
    removeFingerprintOnSuccess: true,
    metadata: {
      bucketName,
      objectName: file.name,
      contentType: file.type,
      cacheControl: '3600',
    },
    chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
    onError,
    onProgress: (bytesUploaded, bytesTotal) => {
      const percentage = Math.round(((bytesUploaded / bytesTotal) * 100));
      setProgress(percentage);
    },
    onSuccess: () => {
      const media: Media = {
        userId: session?.user.id ?? '',
        slug: slugify(file.name, {lower: true, strict: true}),
        alternativeText: file.name,
        url: `/storage/v1/object/public/media/${encodeURIComponent(file.name)}`,
        formats: file.type,
      };
      debug({media});
      addMedia(media).catch((error: object) => {
          onError(error as Error);
      });
    },
  });

  return uploadFile.findPreviousUploads().then((previousUploads) => {
    // Found previous uploads so we select the first one.
    if (previousUploads.length) {
      uploadFile.resumeFromPreviousUpload(previousUploads[0]);
    }

    // Start the upload
    uploadFile.start();
  });
}

export async function addMedia(media: Media): Promise<void> {
  const supabase = createClient();

  debug('addMedia', {media});

  const { data: items, error: lookupError } = await supabase
    .from('media')
    .select()
    .eq('slug', media.slug);

  debug({lookupError, items});

  if (!lookupError && items.length > 0) {
    await supabase
      .from('media')
      .update({
        user_id: media.userId,
        slug: media.slug,
        url: media.url,
        formats: media.formats,
      })
      .eq('slug', media.slug);
    debug('update');
  } else {
    await supabase
      .from('media')
      .insert({
        user_id: media.userId,
        slug: media.slug,
        alternativetext: media.alternativeText,
        caption: media.caption,
        url: media.url,
        width: media.width,
        height: media.height,
        formats: media.formats,
      });
    debug('insert');
  }
}

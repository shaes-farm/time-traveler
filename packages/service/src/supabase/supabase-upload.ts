import debugFactory from 'debug';
import * as tus from 'tus-js-client';
import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../models';
import type { Upload, UploadInfo } from '../types';

const debug = debugFactory('service:supabase:upload');

/**
 * Supabase implementation of the file upload interface.
 */
export class SupabaseUpload implements Upload {

  /**
   * A SupabaseClient object for our database schema.
   */
  private supabase: SupabaseClient<Database>;

  /**
   * Class constructor.
   * @param supabasea - A SupabaseClient object.
   */
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Upload a file.
   * @returns A void promise.
   */
  async upload(bucket: string, path: string, file: File): Promise<void> {
    debug('upload', { file });
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.name);
    debug('upload', {data, error});
    if (error) throw error;
  }

  /**
   * Upload a file, resuming a previous upload if already started and incomplete.
   * @param bucket - Name of storage bucket.
   * @param file - A File object for the file to download.
   * @param setProgress - A function called to update progress percentage.
   * @param onSuccess - A function called after the file is successfully uploaded.
   * @param onError - A function that is called to handle errors.
   * @returns A void promise.
   */
  async resumableUpload(bucket: string, file: File, setProgress: (percentage: number) => void, onSuccess: (info: UploadInfo) => void, onError: (error: Error) => void): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();

    debug({session});
    debug(`Uploading file ${file.name} to ${bucket}`);
  
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
        bucketName: bucket,
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
        const info: UploadInfo = {
          userId: session?.user.id ?? '',
          fileName: file.name,
          fileType: file.type,
          url: `/storage/v1/object/public/${bucket}/${encodeURIComponent(file.name)}`,
        };
        debug('resumableUpload', {info});
        onSuccess(info);
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
}

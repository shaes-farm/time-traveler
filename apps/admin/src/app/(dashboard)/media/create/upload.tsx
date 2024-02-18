'use client';

import debugFactory from 'debug';
import slugify from 'slugify';
import { DragAndDropUpload } from 'ui';
import type { Media, UploadInfo } from 'service';
import { addMedia, upload } from '../../actions';

const debug = debugFactory('admin:app:media:upload');

export function Upload(): JSX.Element {
    function onSuccess(info: UploadInfo): void {
        const img = new Image();
        img.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${encodeURIComponent(info.fileName)}?quality=100`;
        debug('upload', {img});
        setTimeout(() => {
            debug('height', img.naturalHeight);
            debug('width', img.naturalWidth);
            const media: Media = {
                alternativeText: info.fileName,
                formats: info.fileType,
                height: img.naturalHeight ? img.naturalHeight : undefined,
                slug: slugify(info.fileName, { lower: true, strict: true }),
                url: encodeURIComponent(info.fileName),
                userId: info.userId,
                width: img.naturalWidth ? img.naturalWidth : undefined,
            };
            debug({ media });
            addMedia(media).catch((error: unknown) => {
                const { message } = error as Error;
                debug(`Failed because of ${message}`);
            });
        }, 3);
    };

    return (
        <DragAndDropUpload upload={(file, setProgress, onError) => {
            void upload('media', file, setProgress, onSuccess, onError);
        }} />
    );
}

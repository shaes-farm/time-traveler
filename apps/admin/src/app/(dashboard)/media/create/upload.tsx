'use client';

import debugFactory from 'debug';
import slugify from 'slugify';
import { DragAndDropUpload } from 'ui';
import type { Media, UploadInfo } from 'service';
import { addMedia, upload } from '../../actions';

const debug = debugFactory('admin:app:media:upload');

function onError(error: Error): void {
    debug(`Failed because of ${error.message}`);
}

function onSuccess(info: UploadInfo): void {
    const media: Media = {
        alternativeText: info.fileName,
        formats: info.fileType,
        slug: slugify(info.fileName, { lower: true, strict: true }),
        url: `/storage/v1/object/public/media/${encodeURIComponent(info.fileName)}`,
        userId: info.userId,
    };
    debug({ media });
    addMedia(media).catch((error: unknown) => {
        onError(error as Error);
    });
};

export function Upload(): JSX.Element {
    return (
        <DragAndDropUpload upload={(file, setProgress) => {
            void upload('media', file, setProgress, onSuccess, onError);
        }} />
    );
}

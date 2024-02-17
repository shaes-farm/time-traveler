'use client';

import debugFactory from 'debug';
import { DragAndDropUpload } from 'ui';
import { upload } from '../../actions';

const debug = debugFactory('admin:app:media:upload');

function onError(error: Error): void {
    debug(`Failed because of ${error.message}`);
}

export function Upload(): JSX.Element {
   
    return (
        <DragAndDropUpload upload={(file, setProgress) => {
            upload('media', file, setProgress, onError).catch(
                (error: object) => { onError(error as Error) }
            );
        }} />
    );
}

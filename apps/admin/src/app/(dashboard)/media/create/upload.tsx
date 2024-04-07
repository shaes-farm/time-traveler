'use client';

import debugLogger from 'debug';
import slugify from 'slugify';
import { useRouter } from 'next/navigation';
import BackIcon from '@mui/icons-material/ArrowBackIos';
import {
    Box,
    Button,
    Divider,
    Grid,
    Paper,
    Typography,
} from '@mui/material';
import { DragAndDropUpload } from 'ui';
import type { Media, UploadInfo } from 'service';
import { addMedia, upload } from './actions';

const debug = debugLogger('admin:media:upload');

interface UploadProps {
    backUrl: string;
}
export function Upload({backUrl}: UploadProps): JSX.Element {
    const router = useRouter();

    const routeToList = (): void => {
        // redirectTo(backUrl);
        router.push(backUrl);
    };

    function onSuccess(info: UploadInfo): void {
        const img = new Image();
        img.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${encodeURIComponent(info.fileName)}?quality=100`;
        debug('upload', { img });
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
        <Paper elevation={0} sx={{ p: '1rem', width: '100%' }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
                    <Typography variant="h2">
                        Upload Media
                    </Typography>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button onClick={() => { routeToList() }} startIcon={<BackIcon />} sx={{ px: 4 }} variant='outlined'>
                        Back
                    </Button>
                </Grid>
            </Grid>
            <Divider sx={{ my: '1rem' }} />
            <DragAndDropUpload upload={(file, setProgress, onError) => {
                void upload(file, setProgress, onSuccess, onError);
            }} />
        </Paper>
    );
}

'use client';

import debugLogger from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Media } from 'service';
import { getIcon } from '../../../../../utils/media';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugLogger('admin:media:delete:view');

interface ViewProps {
  media: Media;
}

export default function View({ media }: ViewProps): JSX.Element {
  const router = useRouter();

  debug({ media });

  return (
    <ContentEditor title="Delete Media">
      <Stack spacing={3}>
        <Typography variant="body1">
          Are you sure you want to delete this media item?
        </Typography>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          {media.alternativeText}
        </Typography>
        <Box border={1} borderColor="divider" borderRadius={1} p={1} width={{md: '50%', sm: '100%'}}>
          <img
            alt={media.alternativeText ?? ''}
            src={getIcon(media.formats ?? '', media.url)}
            width="100%"
          />
        </Box>
        <Box>
          <Button onClick={() => { router.push('/media') }} sx={{ mr: '1em' }} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => { void remove(media.slug) }} variant='contained'>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

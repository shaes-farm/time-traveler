'use client';

import debugLogger from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Timeline } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugLogger('admin:timelines:delete:view');

interface ViewProps {
  timeline: Timeline;
}

export default function View({ timeline }: ViewProps): JSX.Element {
  const router = useRouter();
  debug({ timeline });
  return (
    <ContentEditor title="Delete a Timeline">
      <Stack spacing={3}>
        <Typography variant="body1">
          Are you sure you want to delete this timeline?
        </Typography>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          {timeline.title}
        </Typography>
        <Box>
          <Button onClick={() => { router.push('/timelines') }} sx={{mr: '1em'}} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => { void remove(timeline.slug) }} variant='contained'>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

'use client';

import debugFactory from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Timeline } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugFactory('admin:timelines:delete:view');

interface ViewProps {
  timeline: Timeline;
}

export default function View({ timeline }: ViewProps): JSX.Element {
  const router = useRouter();

  debug({ timeline });

  return (
    <ContentEditor title="Delete a Timeline">
      <Stack spacing={3}>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          Are you sure you want to delete this timeline?
        </Typography>
        <Typography variant="body1">
          {timeline.title}
        </Typography>
        <Box>
          <Button color="secondary" onClick={() => { router.push('/timelines') }}>
            Cancel
          </Button>
          <Button color="primary" onClick={() => { void remove(timeline.slug) }}>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

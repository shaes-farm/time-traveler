'use client';

import debugLogger from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { HistoricalEvent } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugLogger('admin:events:delete:view');

interface ViewProps {
  event: HistoricalEvent;
}

export default function View({ event }: ViewProps): JSX.Element {
  const router = useRouter();
  debug({ event });
  return (
    <ContentEditor title="Delete an Event">
      <Stack spacing={3}>
        <Typography variant="body1">
          Are you sure you want to delete this event?
        </Typography>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          {event.title}
        </Typography>
        <Box>
          <Button onClick={() => { router.push('/events') }} sx={{mr: '1em'}} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => { void remove(event.slug) }} variant='contained'>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

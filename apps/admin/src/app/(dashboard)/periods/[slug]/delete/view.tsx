'use client';

import debugLogger from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Period } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugLogger('admin:periods:delete:view');

interface ViewProps {
  period: Period;
}

export default function View({ period }: ViewProps): JSX.Element {
  const router = useRouter();
  debug({ period });
  return (
    <ContentEditor title="Delete a Period">
      <Stack spacing={3}>
        <Typography variant="body1">
          Are you sure you want to delete this period?
        </Typography>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          {period.title}
        </Typography>
        <Box>
          <Button onClick={() => { router.push('/periods') }} sx={{mr: '1em'}} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => { void remove(period.slug) }} variant='contained'>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

'use client';

import debugFactory from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Story } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugFactory('admin:stories:delete:view');

interface ViewProps {
  story: Story;
}

export default function View({ story }: ViewProps): JSX.Element {
  const router = useRouter();
  debug({ story });
  return (
    <ContentEditor title="Delete a Story">
      <Stack spacing={3}>
        <Typography variant="body1">
          Are you sure you want to delete this story?
        </Typography>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          {story.title}
        </Typography>
        <Box>
          <Button onClick={() => { router.push('/stories') }} sx={{mr: '1em'}} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => { void remove(story.slug) }} variant='contained'>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

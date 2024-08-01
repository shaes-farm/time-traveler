'use client';

import debugLogger from 'debug';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Category } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugLogger('admin:categories:delete:view');

interface ViewProps {
  category: Category;
}

export default function View({ category }: ViewProps): JSX.Element {
  const router = useRouter();
  debug({ category });
  return (
    <ContentEditor title="Delete a Category">
      <Stack spacing={3}>
        <Typography variant="body1">
          Are you sure you want to delete this category?
        </Typography>
        <Typography sx={{ fontSize: '2em' }} variant="body1">
          {category.title}
        </Typography>
        <Box>
          <Button onClick={() => { router.push('/categories') }} sx={{mr: '1em'}} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={() => { void remove(category.slug) }} variant='contained'>
            Confirm
          </Button>
        </Box>
      </Stack>
    </ContentEditor>
  );
}

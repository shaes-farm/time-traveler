'use client';

import debugFactory from 'debug';
import {useRouter} from 'next/navigation';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { Period } from 'service';
import { ContentEditor } from '../../../../../components';
import { remove } from '../../actions';

const debug = debugFactory('admin:periods:delete:view');

interface ViewProps {
    period: Period;
}

export default function View({period}: ViewProps): JSX.Element {
  const router = useRouter();

  debug({period});

  return (
    <ContentEditor title="Delete a Period">
        <Typography sx={{fontSize: '2em'}} variant="body1">Are you sure you want to delete this period?</Typography>
        <Typography variant="body1">{period.title}</Typography>
        <Button color="secondary" onClick={() => {router.push('/periods')}}>
          Cancel
        </Button>
        <Button color="primary" onClick={() => {void remove(period.slug)}}>
          Confirm
        </Button>
    </ContentEditor>
  );
}

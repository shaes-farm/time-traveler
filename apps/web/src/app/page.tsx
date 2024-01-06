import getConfig from 'next/config';
import {Paper} from '@mui/material';
import {PeriodNavigator} from 'ui';
import {fetchFactory} from 'service';
import type {NextConfig} from '../types';

const {
  serverRuntimeConfig: {
    api: {
      baseUrl,
      backend,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

export default async function Page(): Promise<JSX.Element> {
  const periods = await f.getPeriods();

  return (
    <main>
      <Paper>
        <PeriodNavigator periods={periods} timelineRoute="/timeline" />
      </Paper>
    </main>
  )
}

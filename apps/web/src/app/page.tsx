import { cache } from 'react';
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

export const revalidate = 3600;

const getAllPeriods = cache(async () => {
  return f.getPeriods();
});

export default async function Page(): Promise<JSX.Element> {
  const periods = await getAllPeriods();
  return (
    <main>
      <Paper>
        <PeriodNavigator periods={periods} timelineRoute="/timeline" />
      </Paper>
    </main>
  )
}

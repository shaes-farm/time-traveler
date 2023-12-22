import getConfig from 'next/config';
import {Paper} from '@mui/material';
import {PeriodNavigator} from 'ui';
import {FetchFactory} from 'service';
import type {ServerRuntimeConfig} from '../types';

const {serverRuntimeConfig} = getConfig();

const {api} = serverRuntimeConfig as ServerRuntimeConfig;

export default async function Page(): Promise<JSX.Element> {
  const f = FetchFactory.create(api.backend, api.baseUrl);
  const periods = await f.getPeriods();
  return (
    <main>
      <Paper>
        <PeriodNavigator periods={periods} timelineRoute="/timeline" />
      </Paper>
    </main>
  )
}

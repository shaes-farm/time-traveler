import getConfig from 'next/config';
import {Paper} from '@mui/material';
import {PeriodNavigator} from 'ui';
import {FetchFactory} from 'service';

const {
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig();

export default async function Page(): Promise<JSX.Element> {
  const f = FetchFactory.create(backend, baseUrl);
  const periods = await f.getPeriods();
  return (
    <main>
      <Paper>
        <PeriodNavigator periods={periods} timelineRoute="/timeline" />
      </Paper>
    </main>
  )
}

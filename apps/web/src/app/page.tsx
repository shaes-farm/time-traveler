import config from 'config';
import {Paper} from '@mui/material';
import {PeriodNavigator} from 'ui';
import {Fetch} from 'service';

const f = new Fetch(config.get('api.baseUrl'));

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

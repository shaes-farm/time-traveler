import getConfig from 'next/config';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../types';
import { ContentEditor, PeriodList } from '../../components';

const {
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

export default async function Page(): Promise<JSX.Element> {
  const periods = await f.getPeriods();
  return (
    <ContentEditor count={periods.length} createNewLink="/periods/create" title="Periods">
      <PeriodList periods={periods} />
    </ContentEditor>
  );
}

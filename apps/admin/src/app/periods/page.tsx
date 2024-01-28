import getConfig from 'next/config';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../types';
import { PeriodListView } from '../../views';

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
    <PeriodListView
      createLink="/periods/create"
      deleteLink="/periods/[slug]/delete"
      editLink="/periods/[slug]"
      periods={periods}
    />
  );
}

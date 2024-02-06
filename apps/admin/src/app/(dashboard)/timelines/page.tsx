import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../../types';
import {TimelineListView} from '../../../views';

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
  const timelines = await f.getTimelines();
  return (
    <TimelineListView
      createLink="/timelines/create"
      deleteLink="/timelines/[slug]/delete"
      editLink="/timelines/[slug]"
      timelines={timelines}
    />
  );
}

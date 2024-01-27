import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../types';
import {ContentEditor, TimelineList} from '../../components';

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
    <ContentEditor
      count={timelines.length}
      createNewLink="/timelines/create"
      title="Timelines"
    >
      <TimelineList timelines={timelines} />
    </ContentEditor>
  );
}

import getConfig from 'next/config';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../../types';
import { ContentEditor } from '../../../components';

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
  const categories = await f.getCategories();

  return (
    <ContentEditor title="Create an Event">
      <pre>
        {JSON.stringify({timelines, categories}, null, 2)}
      </pre>
    </ContentEditor>
  );
}

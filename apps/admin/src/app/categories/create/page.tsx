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
  const categories = await f.getCategories();
  const timelines = await f.getTimelines();

  return (
    <ContentEditor title="Create a Category">
      <pre>
        {JSON.stringify({categories, timelines}, null, 2)}
      </pre>
    </ContentEditor>
  );
}

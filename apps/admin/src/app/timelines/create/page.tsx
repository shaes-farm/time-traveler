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
  const periods = await f.getPeriods();

  return (
    <ContentEditor title="Create a Timeline">
      <pre>
        {JSON.stringify({periods}, null, 2)}
      </pre>
    </ContentEditor>
  );
}

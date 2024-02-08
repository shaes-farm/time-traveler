import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../../types';

const {
  serverRuntimeConfig: {
    api: {
      baseUrl,
      backend,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

export default async function Page(): Promise<JSX.Element> {
  const periods = await f.getPeriods();
  const timelines = await f.getTimelines();

  return (
    <pre>
        {JSON.stringify({periods, timelines}, null, 2)}
    </pre>
  );
}

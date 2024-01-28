import getConfig from 'next/config';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../../types';
import { ContentEditor } from '../../../components';
import { PeriodFormView } from '../../../views';

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
    <ContentEditor title="Create a Period">
      <PeriodFormView
        mode="create"
        timelines={timelines}
      />
    </ContentEditor>
  );
}

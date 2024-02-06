import getConfig from 'next/config';
import {notFound} from 'next/navigation';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../../../types';
import { ContentEditor } from '../../../../components';

const {
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const { params: { slug } } = props;
  const timeline = await f.getTimeline(slug);
  
  if (!timeline) {
    notFound();
  }
  
  const periods = await f.getPeriods();

  return (
    <ContentEditor title="Edit a Timeline">
      <pre>
        {JSON.stringify({timeline, periods}, null, 2)}
      </pre>
    </ContentEditor>
  );
}

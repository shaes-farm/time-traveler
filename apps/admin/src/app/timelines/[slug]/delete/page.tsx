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

  return (
    <ContentEditor title="Delete a Timeline">
        <h2>Are you sure you want to delete this timeline?</h2>
        <p>{timeline.title}</p>
    </ContentEditor>
  );
}

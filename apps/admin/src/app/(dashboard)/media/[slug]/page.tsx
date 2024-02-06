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
  const media = await f.getMediaItem(slug);

  if (!media) {
    notFound();
  }

  return (
    <ContentEditor title="Edit a Media Item">
      <pre>
        {JSON.stringify({media}, null, 2)}
      </pre>
    </ContentEditor>
  );
}

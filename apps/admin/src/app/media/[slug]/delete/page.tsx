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
    <ContentEditor title="Delete a Media Item">
        <h2>Are you sure you want to delete this media?</h2>
        <p>{media.alternativeText}</p>
    </ContentEditor>
  );
}

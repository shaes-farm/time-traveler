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
  const event = await f.getEvent(slug);

  if (!event) {
    notFound();
  }

  return (
    <ContentEditor title="Delete an Event">
        <h2>Are you sure you want to delete this event?</h2>
        <p>{event.title}</p>
    </ContentEditor>
  );
}

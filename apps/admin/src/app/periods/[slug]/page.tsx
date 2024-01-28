import getConfig from 'next/config';
import {notFound} from 'next/navigation';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../../types';
import { ContentEditor, PeriodForm } from '../../../components';

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
  const timelines = await f.getTimelines();
  const period = await f.getPeriod(slug);

  if (!period) {
    notFound();
  }

  return (
    <ContentEditor title="Edit a Period">
      <PeriodForm mode="edit" period={period} timelines={timelines} />
    </ContentEditor>
  );
}

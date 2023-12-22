import getConfig from 'next/config';
import {notFound} from 'next/navigation'
import {Breadcrumbs, type Crumb, TimelineNavigator} from 'ui';
import {FetchFactory} from 'service';
import type {PublicRuntimeConfig, ServerRuntimeConfig} from '../../../types';

const {publicRuntimeConfig, serverRuntimeConfig} = getConfig();

const {app} = publicRuntimeConfig as PublicRuntimeConfig;
const {api} = serverRuntimeConfig as ServerRuntimeConfig;

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const {params} = props;
  const f = FetchFactory.create(api.backend, api.baseUrl);
  const timeline = await f.getTimeline(params.slug);

  if (!timeline) {
    notFound();
  }

  const crumbs: Crumb[] = [{
    label: app.title,
    link: '/',
  }];
  
  crumbs.push({
    label: 'Period One',
    link: '/periods/[slug]',
  });
  
  crumbs.push({
    label: timeline.title,
  });

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <main>
        <TimelineNavigator timeline={timeline} />
      </main>
    </>
  );
}

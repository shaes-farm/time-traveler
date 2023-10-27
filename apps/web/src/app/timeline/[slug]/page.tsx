import config from 'config';
import {notFound} from 'next/navigation'
import {Breadcrumbs, TimelineNavigator} from 'ui';
import {Fetch} from 'service';
import type {AppConfig} from '../../../types';

const app: AppConfig = config.get('app');

const f = new Fetch(config.get('api.baseUrl'));

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const {params} = props;
  const timeline = await f.getTimeline(params.slug);

  if (!timeline) {
    notFound();
  }

  const crumbs = [{
    label: app.title,
    link: '/',
  },{
    label: 'Period One',
    link: '/periods/[slug]',
  },{
    label: timeline.title,
  }];

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <main>
        <TimelineNavigator timeline={timeline} />
      </main>
    </>
  );
}

import getConfig from 'next/config';
import {notFound} from 'next/navigation'
import {Breadcrumbs, type Crumb, TimelineNavigator} from 'ui';
import {FetchFactory} from 'service';

const {
  publicRuntimeConfig: {
    app: {
      title,
    }
  },
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig();

const f = FetchFactory.create(backend, baseUrl);

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const {params: {slug}} = props;
  const timeline = await f.getTimeline(slug);

  if (!timeline) {
    notFound();
  }

  const crumbs: Crumb[] = [{
    label: title,
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

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

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const {
    params: {
      slug,
    }
  } = props;
  const f = FetchFactory.create(backend, baseUrl);
  const timeline = await f.getTimeline(slug);

  if (!timeline) {
    notFound();
  }

  const crumbs: Crumb[] = [{
    label: title,
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

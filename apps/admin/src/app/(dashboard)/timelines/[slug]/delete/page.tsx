import debugLogger from 'debug';
import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import TimelineDeleteView from './view';

const debug = debugLogger('admin:timelines:delete:page');

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  debug({slug});

  const timeline = await queryBySlug(slug);

  debug({timeline});
  
  if (!timeline) {
    notFound();
  }

  return <TimelineDeleteView timeline={timeline} />;
}

import debugFactory from 'debug';
import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import TimelineDeleteView from './view';

const debug = debugFactory('admin:timelines:delete:page');

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const { params: { slug } } = props;

  debug({slug});

  const timeline = await queryBySlug(slug);

  debug({timeline});
  
  if (!timeline) {
    notFound();
  }

  return <TimelineDeleteView timeline={timeline} />;
}

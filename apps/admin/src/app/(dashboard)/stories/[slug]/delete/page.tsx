import debugFactory from 'debug';
import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import StoryDeleteView from './view';

const debug = debugFactory('admin:stories:delete:page');

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  debug({slug});

  const story = await queryBySlug(slug);

  debug({story});

  if (!story) {
    notFound();
  }

  return <StoryDeleteView story={story} />;
}

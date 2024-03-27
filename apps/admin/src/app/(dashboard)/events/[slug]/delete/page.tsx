import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import EventDeleteView from './view';

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  const event = await queryBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventDeleteView event={event} />;
}

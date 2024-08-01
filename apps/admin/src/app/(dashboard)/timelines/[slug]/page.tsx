import { notFound } from 'next/navigation';
import { queryBySlug } from '../actions';
import { queryAll as queryAllEvents } from '../../events/actions';
import TimelineEditView from '../edit-view';

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  const timeline = await queryBySlug(slug);

  if (!timeline) {
    notFound();
  }

  const events = await queryAllEvents();

  return (
    <TimelineEditView
      events={events}
      mode="edit"
      timeline={timeline}
    />
  );
}

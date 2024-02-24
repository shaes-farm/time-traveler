import { notFound } from 'next/navigation';
import { ContentEditor } from '../../../../components';
import { TimelineForm } from '../../../../forms';
import { insert, queryBySlug, update } from '../actions';
import { queryAll as queryAllEvents } from '../../events/actions';

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
    <ContentEditor title="Edit a Timeline">
      <TimelineForm
        create={insert}
        events={events}
        mode="edit"
        timeline={timeline}
        update={update}
      />
    </ContentEditor>
  );
}

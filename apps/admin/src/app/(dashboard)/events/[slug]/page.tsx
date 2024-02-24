import { notFound } from 'next/navigation';
import { ContentEditor } from '../../../../components';
import { insert, queryBySlug, update } from '../actions';
import { queryAll as queryAllMedia } from '../../media/actions';
import HistoricalEventForm from '../form';

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

  const media = await queryAllMedia();

  return (
    <ContentEditor title="Edit an Event">
      <HistoricalEventForm
        create={insert}
        event={event}
        media={media}
        mode="edit"
        update={update}
      />
    </ContentEditor>
  );
}

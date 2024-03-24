import { notFound } from 'next/navigation';
import { queryBySlug } from '../actions';
import { queryAll as queryAllMedia } from '../../media/actions';
import HistoricalEventEditView from '../edit-view';

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
    <HistoricalEventEditView
      event={event}
      media={media}
      mode="edit"
    />
  );
}

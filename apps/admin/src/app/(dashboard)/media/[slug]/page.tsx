import { notFound } from 'next/navigation';
import { queryBySlug } from '../actions';
import MediaEditView from '../edit-view';

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  const media = await queryBySlug(slug);

  if (!media) {
    notFound();
  }

  return (
    <MediaEditView
      media={media}
    />
  );
}

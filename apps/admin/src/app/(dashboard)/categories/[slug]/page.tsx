import { notFound } from 'next/navigation';
import { queryBySlug } from '../actions';
import { queryAll as queryAllEvents } from '../../events/actions';
import CategoryEditView from '../edit-view';

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  const category = await queryBySlug(slug);

  if (!category) {
    notFound();
  }

  const events = await queryAllEvents();

  return (
    <CategoryEditView
      category={category}
      events={events}
      mode="edit"
    />
  );
}

import { notFound } from 'next/navigation';
import { ContentEditor } from '../../../../components';
import { CategoryForm } from '../../../../forms';
import { insert, queryBySlug, update } from '../actions';
import { queryAll as queryAllEvents } from '../../events/actions';

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
    <ContentEditor title="Edit a Category">
      <CategoryForm
        category={category}
        create={insert}
        events={events}
        mode="edit"
        update={update}
      />
    </ContentEditor>
  );
}

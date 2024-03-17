import { notFound } from 'next/navigation';
import { queryBySlug } from '../actions';
import { queryAll as queryAllPeriods } from '../../periods/actions';
import StoryEditView from '../edit-view';

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  const story = await queryBySlug(slug);

  if (!story) {
    notFound();
  }

  const periods = await queryAllPeriods();

  return (
    <StoryEditView
      mode="edit"
      periods={periods}
      story={story}
    />
  );
}

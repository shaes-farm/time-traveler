import { notFound } from 'next/navigation';
import { ContentEditor } from '../../../../components';
import { queryBySlug } from '../actions';
import { queryAll as queryAllPeriods } from '../../periods/actions';
import StoryForm from '../form';

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
    <ContentEditor title="Edit a Story">
      <StoryForm
        mode="edit"
        periods={periods}
        story={story}
      />
    </ContentEditor>
  );
}

import { notFound } from 'next/navigation';
import { ContentEditor } from '../../../../components';
import { queryBySlug } from '../actions';

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
    <ContentEditor title="Edit a Media Item">
      <pre>
        {JSON.stringify({ media }, null, 2)}
      </pre>
    </ContentEditor>
  );
}

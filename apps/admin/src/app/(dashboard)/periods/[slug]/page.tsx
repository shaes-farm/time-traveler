import { notFound } from 'next/navigation';
import { ContentEditor } from '../../../../components';
import { PeriodForm } from '../../../../forms';
import { insert, queryBySlug, update } from '../actions';
import { queryAll as queryAllTimelines } from '../../timelines/actions';

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  const period = await queryBySlug(slug);

  if (!period) {
    notFound();
  }

  const timelines = await queryAllTimelines();

  return (
    <ContentEditor title="Edit a Period">
      <PeriodForm
        create={insert}
        mode="edit"
        period={period}
        timelines={timelines}
        update={update}
      />
    </ContentEditor>
  );
}

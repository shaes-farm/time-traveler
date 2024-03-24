import { notFound } from 'next/navigation';
import { queryBySlug } from '../actions';
import { queryAll as queryAllTimelines } from '../../timelines/actions';
import PeriodEditView from '../edit-view';

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
    <PeriodEditView
      mode="edit"
      period={period}
      timelines={timelines}
    />
  );
}

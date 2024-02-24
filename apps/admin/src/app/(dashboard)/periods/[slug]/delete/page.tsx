import debugFactory from 'debug';
import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import PeriodDeleteView from './view';

const debug = debugFactory('admin:periods:delete:page');

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page({ params: { slug } }: PageProps): Promise<JSX.Element> {
  debug({slug});

  const period = await queryBySlug(slug);

  debug({period});
  
  if (!period) {
    notFound();
  }

  return <PeriodDeleteView period={period} />;
}

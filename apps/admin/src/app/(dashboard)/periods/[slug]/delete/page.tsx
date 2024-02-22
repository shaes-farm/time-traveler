import debugFactory from 'debug';
import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import { PeriodDeleteView } from './period-delete-view';

const debug = debugFactory('admin:periods:delete:page');

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const { params: { slug } } = props;

  debug({slug});

  const period = await queryBySlug(slug);

  debug({period});
  
  if (!period) {
    notFound();
  }

  return <PeriodDeleteView period={period} />;
}

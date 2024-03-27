import { notFound } from 'next/navigation';
import { queryBySlug } from '../../actions';
import CategoryDeleteView from './view';

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

  return <CategoryDeleteView category={category} />;
}

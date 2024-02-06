import getConfig from 'next/config';
import {notFound} from 'next/navigation';
import { fetchFactory } from 'service';
import type { NextConfig } from '../../../../../types';
import { ContentEditor } from '../../../../../components';

const {
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

interface PageProps {
  params: {
    slug: string;
  }
}

export default async function Page(props: PageProps): Promise<JSX.Element> {
  const { params: { slug } } = props;
  const category = await f.getCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <ContentEditor title="Delete a Category">
        <h2>Are you sure you want to delete this category?</h2>
        <p>{category.title}</p>
    </ContentEditor>
  );
}

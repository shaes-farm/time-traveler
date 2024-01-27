import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../types';
import {CategoryList, ContentEditor} from '../../components';

const {
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

export default async function Page(): Promise<JSX.Element> {
  const categories = await f.getCategories();

  return (
    <ContentEditor count={categories.length} createNewLink="/categories/create" title="Categories">
      <CategoryList categories={categories} />
    </ContentEditor>
  );
}

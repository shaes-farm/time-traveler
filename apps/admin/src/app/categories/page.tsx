import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../types';
import {CategoryListView} from '../../views';

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
    <CategoryListView
      categories={categories}
      createLink="/categories/create"
      deleteLink="/categories/[slug]/delete"
      editLink="/categories/[slug]"
    />
  );
}

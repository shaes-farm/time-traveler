import { queryAll } from './actions';
import CategoryGridView from './grid-view';

export default async function Page(): Promise<JSX.Element> {
  const categories = await queryAll();
  return (
    <CategoryGridView
      categories={categories}
      createLink="/categories/create"
      deleteLink="/categories/[slug]/delete"
      editLink="/categories/[slug]"
    />
  );
}

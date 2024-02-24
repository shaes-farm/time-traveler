import { CategoryListView } from '../../../views';
import { queryAll } from './actions';

export default async function Page(): Promise<JSX.Element> {
  const categories = await queryAll();
  return (
    <CategoryListView
      categories={categories}
      createLink="/categories/create"
      deleteLink="/categories/[slug]/delete"
      editLink="/categories/[slug]"
    />
  );
}

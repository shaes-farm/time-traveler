import { PeriodListView } from '../../../views';
import { queryAll } from './actions';

export default async function Page(): Promise<JSX.Element> {
  const periods = await queryAll();
  return (
    <PeriodListView
      createLink="/periods/create"
      deleteLink="/periods/[slug]/delete"
      editLink="/periods/[slug]"
      periods={periods}
    />
  );
}

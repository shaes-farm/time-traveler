import { queryAll } from './actions';
import PeriodGridView from './grid-view';

export default async function Page(): Promise<JSX.Element> {
  const periods = await queryAll();
  return (
    <PeriodGridView
      createLink="/periods/create"
      deleteLink="/periods/[slug]/delete"
      editLink="/periods/[slug]"
      periods={periods}
    />
  );
}

import { TimelineListView } from '../../../views';
import { queryAll } from './actions';

export default async function Page(): Promise<JSX.Element> {
  const timelines = await queryAll();
  return (
    <TimelineListView
      createLink="/timelines/create"
      deleteLink="/timelines/[slug]/delete"
      editLink="/timelines/[slug]"
      timelines={timelines}
    />
  );
}

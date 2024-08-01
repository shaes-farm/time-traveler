import { queryAll } from './actions';
import TimelineGridView from './grid-view';

export default async function Page(): Promise<JSX.Element> {
  const timelines = await queryAll();
  return (
    <TimelineGridView
      createLink="/timelines/create"
      deleteLink="/timelines/[slug]/delete"
      editLink="/timelines/[slug]"
      timelines={timelines}
    />
  );
}

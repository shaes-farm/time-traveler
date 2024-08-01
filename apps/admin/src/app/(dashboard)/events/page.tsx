import { queryAll } from './actions';
import EventGridView from './grid-view';

export default async function Page(): Promise<JSX.Element> {
  const events = await queryAll();
  return (
    <EventGridView
      createLink="/events/create"
      deleteLink="/events/[slug]/delete"
      editLink="/events/[slug]"
      events={events}
    />
  );
}

import { queryAll as queryAllEvents } from '../../events/actions';
import CategoryEditView from '../edit-view';

export default async function Page(): Promise<JSX.Element> {
  const events = await queryAllEvents();
  return (
      <CategoryEditView
        events={events}
        mode="create"
      />
  );
}

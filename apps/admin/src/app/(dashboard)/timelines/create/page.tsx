import { queryAll as queryAllEvents } from '../../events/actions';
import TimelineEditView from '../edit-view';

export default async function Page(): Promise<JSX.Element> {
  const events = await queryAllEvents();
  return (
    <TimelineEditView
      events={events}
      mode="create"
    />
  );
}

import { ContentEditor } from '../../../../components';
import { CategoryForm } from '../../../../forms';
import { insert, update } from '../actions';
import { queryAll as queryAllEvents } from '../../events/actions';

export default async function Page(): Promise<JSX.Element> {
  const events = await queryAllEvents();
  return (
    <ContentEditor title="Create a Category">
      <CategoryForm
        create={insert}
        events={events}
        mode="create"
        update={update}
      />
    </ContentEditor>
  );
}

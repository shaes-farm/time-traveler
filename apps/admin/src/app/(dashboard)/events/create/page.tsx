import { ContentEditor } from '../../../../components';
import { insert, update } from '../actions';
import { queryAll as queryAllMedia } from '../../media/actions';
import HistoricalEventForm from '../form';

export default async function Page(): Promise<JSX.Element> {
  const media = await queryAllMedia();
  return (
    <ContentEditor title="Create an Event">
      <HistoricalEventForm
        create={insert}
        media={media}
        mode="create"
        update={update}
      />
    </ContentEditor>
  );
}

import { queryAll as queryAllMedia } from '../../media/actions';
import HistoricalEventEditView from '../edit-view';

export default async function Page(): Promise<JSX.Element> {
  const media = await queryAllMedia();
  return (
      <HistoricalEventEditView
        media={media}
        mode="create"
      />
  );
}

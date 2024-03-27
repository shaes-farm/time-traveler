import { queryAll as queryAllTimelines } from '../../timelines/actions';
import PeriodEditView from '../edit-view';

export default async function Page(): Promise<JSX.Element> {
  const timelines = await queryAllTimelines();
  return (
    <PeriodEditView
      mode="create"
      timelines={timelines}
    />
  );
}

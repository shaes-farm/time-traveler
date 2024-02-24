import { ContentEditor } from '../../../../components';
import { insert, update } from '../actions';
import { queryAll as queryAllTimelines } from '../../timelines/actions';
import PeriodForm from '../form';

export default async function Page(): Promise<JSX.Element> {
  const timelines = await queryAllTimelines();
  return (
    <ContentEditor title="Create a Period">
      <PeriodForm
        create={insert}
        mode="create"
        timelines={timelines}
        update={update}
      />
    </ContentEditor>
  );
}

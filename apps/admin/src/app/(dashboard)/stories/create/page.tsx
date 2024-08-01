import { queryAll as queryAllPeriods } from '../../periods/actions';
import StoryEditView from '../edit-view';

export default async function Page(): Promise<JSX.Element> {
  const periods = await queryAllPeriods();
  return (
    <StoryEditView
      mode="create"
      periods={periods}
    />
  );
}

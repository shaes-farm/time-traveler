import { ContentEditor } from '../../../../components';
import { queryAll as queryAllPeriods } from '../../periods/actions';
import StoryForm from '../form';

export default async function Page(): Promise<JSX.Element> {
  const periods = await queryAllPeriods();
  return (
    <ContentEditor title="Create a Story">
      <StoryForm
        mode="create"
        periods={periods}
      />
    </ContentEditor>
  );
}

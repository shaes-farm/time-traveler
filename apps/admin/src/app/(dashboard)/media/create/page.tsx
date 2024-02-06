import { DragAndDropUpload } from 'ui';
import { ContentEditor } from '../../../../components';

export default function Page(): JSX.Element {
  return (
    <ContentEditor title="Upload New Media">
      <DragAndDropUpload />
    </ContentEditor>
  );
}

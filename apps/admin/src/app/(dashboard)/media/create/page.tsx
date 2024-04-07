import { ContentEditor } from '../../../../components';
import { Upload } from './upload';

export default function Page(): JSX.Element {
  return (
    <ContentEditor title="Media">
      <Upload backUrl="/media" />
    </ContentEditor>
  );
}

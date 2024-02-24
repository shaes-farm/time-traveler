import { ContentEditor } from '../../../../components';
import { Upload } from './upload';

export default function Page(): JSX.Element {
  return (
    <ContentEditor title="Upload New Media">
      <Upload />
    </ContentEditor>
  );
}

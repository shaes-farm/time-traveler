import { MediaTabView } from '../../../views';
import { queryAll } from './actions';

export default async function Page(): Promise<JSX.Element> {
    const media = await queryAll();

  return (
    <MediaTabView
      createLink="/media/create"
      deleteLink="/media/[slug]/delete"
      editLink="/media/[slug]"
      media={media}
    />
  );
}

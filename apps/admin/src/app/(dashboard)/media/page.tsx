import { queryAll } from './actions';
import MediaTabView from './tab-view';

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

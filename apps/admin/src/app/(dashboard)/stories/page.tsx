import { queryAll } from './actions';
import StoryGridView from './grid-view';

export default async function Page(): Promise<JSX.Element> {
  const stories = await queryAll();
  return (
    <StoryGridView
      createLink="/stories/create"
      deleteLink="/stories/[slug]/delete"
      editLink="/stories/[slug]"
      stories={stories}
    />
  );
}

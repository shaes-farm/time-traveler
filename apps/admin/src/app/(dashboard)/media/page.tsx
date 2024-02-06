import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../../types';
import {MediaListView} from '../../../views';

const {
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  }
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

export default async function Page(): Promise<JSX.Element> {
  const media = await f.getMedia();
  return (
    <MediaListView
      createLink="/media/create"
      deleteLink="/media/[slug]/delete"
      editLink="/media/[slug]"
      media={media}
    />
  );
}

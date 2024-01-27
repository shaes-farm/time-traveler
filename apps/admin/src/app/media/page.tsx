import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../types';
import {ContentEditor, MediaList} from '../../components';

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
    <ContentEditor count={media.length} createNewLink="/media/create" title="Media Library">
      <MediaList media={media} />
    </ContentEditor>
  );
}

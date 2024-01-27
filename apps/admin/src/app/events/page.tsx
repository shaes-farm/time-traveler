import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../types';
import {ContentEditor, EventList} from '../../components';

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
  const events = await f.getEvents();

  return (
    <ContentEditor count={events.length} createNewLink="/events/create" title="Events">
      <EventList events={events} />
    </ContentEditor>
  );
}

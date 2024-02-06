import getConfig from 'next/config';
import {fetchFactory} from 'service';
import type {NextConfig} from '../../../types';
import {EventListView} from '../../../views';

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
    <EventListView
      createLink="/events/create"
      deleteLink="/events/[slug]/delete"
      editLink="/events/[slug]"
      events={events}
    />
  );
}

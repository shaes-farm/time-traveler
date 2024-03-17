import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextConfig } from '../../../types';
import { createClient } from '../../../utils/supabase/server';
// import ProfileForm from './form';
import ProfileEditView from './edit-view';
import { queryById } from './actions';

const {
  publicRuntimeConfig: {
    app: {
      baseUrl: appBaseUrl,
      basePath,
    },
  },
} = getConfig() as NextConfig;

export default async function Page(): Promise<JSX.Element> {
  const supabase = createClient(cookies());

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  const profile = await queryById(session.user.id);

  if (!profile) {
    // SHOULD SIGN OUT FIRST
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  return <ProfileEditView profile={profile} user={session.user} />;
}

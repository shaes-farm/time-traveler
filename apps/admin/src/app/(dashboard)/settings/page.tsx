import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server';
import { getAppConfig } from '../../../utils/config';
import { queryUserProfile } from './actions';

const {
  baseUrl: appBaseUrl,
  basePath,
} = getAppConfig();

export default async function Page(): Promise<JSX.Element> {
  const supabase = createClient(cookies());

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  const profile = await queryUserProfile(session.user.id);

  if (!profile) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  return (
    <pre>
      {JSON.stringify({ profile }, null, 2)}
    </pre>
  );
}

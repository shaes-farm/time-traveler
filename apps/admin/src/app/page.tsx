import debugLogger from 'debug';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../utils/supabase/server'
import { getAppConfig } from '../utils/config';

const debug = debugLogger('admin:app:error');

const {
  baseUrl: appBaseUrl,
  basePath,
} = getAppConfig();

export default async function Page(): Promise<JSX.Element | null> {
  const supabase = createClient(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();

  debug({ error, user });

  if (error || !user) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  } else {
    redirect(`${appBaseUrl}${basePath}/dashboard`);
  }
}
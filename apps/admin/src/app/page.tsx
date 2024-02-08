import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type {NextConfig} from '../types';
import { createClient } from '../utils/supabase/server'

const {
  serverRuntimeConfig: {
    api: {
      baseUrl,
      key,
    }
  }
} = getConfig() as NextConfig;

export default async function Page(): Promise<JSX.Element | null> {
  const cookieStore = cookies()
  const supabase = createClient(baseUrl, key, cookieStore)

  const { data, error } = await supabase.auth.getUser()

  const {log} = console;

  log({data});

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- test data
  if (error || !data?.user) {
    redirect('/signin')
  }

  redirect('/dashboard');
 
  return null;
}
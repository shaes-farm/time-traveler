import debugFactory from 'debug';
import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../utils/supabase/server'
import type {NextConfig} from '../types';

const { 
  publicRuntimeConfig: {
    app: {
      baseUrl: appBaseUrl,
      basePath,
    },
  },
} = getConfig() as NextConfig;

const debug = debugFactory('admin:app:error');

export default async function Page(): Promise<JSX.Element | null> {
  const supabase = createClient(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();

  debug({error, user});

  if (error || !user) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  } else {
    redirect(`${appBaseUrl}${basePath}/dashboard`);
  }
}
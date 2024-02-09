import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchFactory } from 'service';
import type { NextConfig } from '../../types';
import { DashboardLayout } from '../../layouts';
import { createClient } from '../../utils/supabase/server';

const {
  publicRuntimeConfig: {
    app: {
      copyright: {
        holder,
        url,
        year,
      },
    },
  },
  serverRuntimeConfig: {
    api: {
      backend,
      baseUrl,
    }
  },
} = getConfig() as NextConfig;

const f = fetchFactory(backend, baseUrl);

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const supabase = createClient(cookies());

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) redirect('/signin');

  const profile = await f.getProfile(session.user.id);
  if (!profile) redirect('/signin');

  return (
    <DashboardLayout name={holder} url={url} userProfile={profile} year={year}>
      <main>
        {children}
      </main>
    </DashboardLayout>
  );
}

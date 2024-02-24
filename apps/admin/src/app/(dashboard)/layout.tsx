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
      baseUrl: appBaseUrl,
      basePath,
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

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  const profile = await f.getProfile(user.id);

  if (!profile) {
    redirect(`${appBaseUrl}${basePath}/signin`);
  }

  return (
    <DashboardLayout name={holder} url={url} userProfile={profile} year={year}>
      <main>
        {children}
      </main>
    </DashboardLayout>
  );
}

import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextConfig } from '../../types';
import { DashboardLayout } from '../../layouts';
import { createClient } from '../../utils/supabase/server';
import { queryById } from './profile/actions';

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
} = getConfig() as NextConfig;

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

  const profile = await queryById(user.id);

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
